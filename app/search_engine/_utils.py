
from schemas import SearchResult
from collections import defaultdict

def _filter(results: list[SearchResult], pre_filter_results: set):

    if pre_filter_results is None:
        return results
    print(f'Len results in filter {len(results)}')
    if len(results) == 0:      # Gỉa định trả về kết quả nếu người dùng chỉ filter
        return [SearchResult(
            score=1, imgId = img_id, videoId=img_id.split('-')[0], selectedFrame=int(img_id.split('-')[1])
        ) for img_id in pre_filter_results]

    return [result for result in results if result.imgId in pre_filter_results]

def _temporal(all_results: list[list[SearchResult]]) -> list[SearchResult]:
    """
    Ghép kết quả nhiều scene theo thứ tự thời gian trong cùng video.

    Với mỗi video xuất hiện ở tất cả scene, dynamic programming chọn chuỗi
    ``selectedFrame`` tăng nghiêm ngặt có tổng score lớn nhất. Mỗi video hợp lệ
    trả về đúng một frame cho mỗi temporal query, theo thứ tự scene.
    """
    if not all_results:
        return []
    if len(all_results) == 1:
        return all_results[0]

    by_video_per_scene: list[dict[str, list[SearchResult]]] = []
    video_sets: list[set[str]] = []
    for results in all_results:
        by_video: dict[str, list[SearchResult]] = defaultdict(list)
        for result in results:
            by_video[result.videoId].append(result)
        by_video_per_scene.append(by_video)
        video_sets.append(set(by_video))

    common_videos = set.intersection(*video_sets) if video_sets else set()
    if not common_videos:
        return []

    scene_count = len(all_results)
    ranked_sequences: list[tuple[float, str, list[SearchResult]]] = []

    for video_id in common_videos:
        layers = [
            sorted(
                by_video[video_id],
                key=lambda result: (
                    result.selectedFrame,
                    -result.score,
                    result.imgId,
                ),
            )
            for by_video in by_video_per_scene
        ]

        # dp_scores[j]: tổng score tốt nhất của chuỗi kết thúc tại candidate j.
        dp_scores = [float(result.score) for result in layers[0]]
        parents: list[list[int]] = [[-1] * len(layers[0])]
        has_complete_path = True

        for scene_index in range(1, scene_count):
            previous_layer = layers[scene_index - 1]
            current_layer = layers[scene_index]
            current_scores = [float("-inf")] * len(current_layer)
            current_parents = [-1] * len(current_layer)

            # Hai layer đã sort theo frame. Prefix maximum giúp chuyển trạng
            # thái DP trong O(len(previous_layer) + len(current_layer)).
            previous_index = 0
            best_previous_index = -1
            for current_index, current_result in enumerate(current_layer):
                while (
                    previous_index < len(previous_layer)
                    and previous_layer[previous_index].selectedFrame
                    < current_result.selectedFrame
                ):
                    if dp_scores[previous_index] != float("-inf"):
                        if best_previous_index == -1:
                            best_previous_index = previous_index
                        else:
                            candidate_key = (
                                dp_scores[previous_index],
                                -previous_layer[previous_index].selectedFrame,
                                previous_layer[previous_index].imgId,
                            )
                            best_key = (
                                dp_scores[best_previous_index],
                                -previous_layer[best_previous_index].selectedFrame,
                                previous_layer[best_previous_index].imgId,
                            )
                            if candidate_key > best_key:
                                best_previous_index = previous_index
                    previous_index += 1

                if best_previous_index != -1:
                    current_scores[current_index] = (
                        dp_scores[best_previous_index]
                        + float(current_result.score)
                    )
                    current_parents[current_index] = best_previous_index

            if all(score == float("-inf") for score in current_scores):
                has_complete_path = False
                break

            dp_scores = current_scores
            parents.append(current_parents)

        if not has_complete_path:
            continue

        reachable_endpoints = [
            index
            for index, score in enumerate(dp_scores)
            if score != float("-inf")
        ]
        end_index = min(
            reachable_endpoints,
            key=lambda index: (
                -dp_scores[index],
                layers[-1][index].selectedFrame,
                layers[-1][index].imgId,
            ),
        )
        total_score = dp_scores[end_index]

        chosen_frames: list[SearchResult] = [layers[0][0]] * scene_count
        candidate_index = end_index
        for scene_index in range(scene_count - 1, -1, -1):
            chosen_frames[scene_index] = layers[scene_index][candidate_index]
            if scene_index > 0:
                candidate_index = parents[scene_index][candidate_index]

        average_score = float(total_score / scene_count)
        scored_sequence = [
            frame.model_copy(update={"score": average_score})
            for frame in chosen_frames
        ]
        ranked_sequences.append((average_score, video_id, scored_sequence))

    ranked_sequences.sort(key=lambda item: (-item[0], item[1]))
    return [
        frame
        for _, _, sequence in ranked_sequences
        for frame in sequence
    ]


def _merge(tab_results: dict[str, list[SearchResult]]) -> list[SearchResult]:
    """
    Tính Weighted RRF
    """
    if not tab_results:
        return []
    
    weights = {
        "textual": 1,
        "object_pos": 1,
        "ocr": 1,
        "asr": 1,
        "tags": 1
    }

    new_results = dict()

    for name, results in tab_results.items():

        for rank, result in enumerate(results):

            if result.imgId not in new_results:
                result.score = 0
                new_results[result.imgId] = result
            
            new_results[result.imgId].score += weights[name]*(100/(100 + rank))
    
    list_results = sorted(new_results.values(), key=lambda x: x.score, reverse=True)

    return list_results


def _slice(
    results: list[SearchResult],
    n_frames_per_round: int,
) -> list[SearchResult]:
    """
    Group theo videoId rồi interleave kết quả.

    Mỗi vòng lấy tối đa n_frames_per_round frame của mỗi video.
    Thứ tự các video được quyết định bởi score cao nhất của video đó.
    """
   
    if not results:
        return []
    
    # Group theo video
    groups: dict[str, list[SearchResult]] = defaultdict(list)

    for result in results:
        groups[result.videoId].append(result)

    # Đảm bảo mỗi group giảm dần theo score
    for group in groups.values():
        group.sort(key=lambda x: x.score, reverse=True)

    # Sắp xếp các group theo score lớn nhất
    ordered_groups = sorted(
        groups.values(),
        key=lambda g: g[0].score,
        reverse=True,
    )

    output: list[SearchResult] = []

    
    for group in ordered_groups:
        take = min(n_frames_per_round, len(group))
        if take > 0:
            output.extend(group[:take])

    print(len(output))
    return output
    

