
from schemas import SearchResult
from collections import defaultdict

def _filter(results: list[SearchResult], pre_filter_results: set):

    if pre_filter_results is None:
        return results
    
    if len(results) == 0:      # Gỉa định trả về kết quả nếu người dùng chỉ filter
        return [SearchResult(
            score=1, imgId = img_id, videoId=img_id.split('-')[0], selectedFrame=int(img_id.split('-')[1])
        ) for img_id in pre_filter_results]

    return [result for result in results if result.imgId in pre_filter_results]

def _temporal(all_results):
    """
    Ghép kết quả nhiều scene theo thứ tự thời gian trong cùng video.

    - 1 scene: trả về nguyên.
    - N scene: chỉ giữ video xuất hiện ở mọi scene, với selectedFrame tăng dần.
      Score đại diện = trung bình score các frame đã chọn; trả về frame scene đầu.
    """
    if not all_results:
        return []
    if len(all_results)==1:
        return all_results[0]

    by_video_per_tab = []
    video_sets = []
    for results in all_results:
        by_v = defaultdict(list)
        for r in results:
            by_v[r.videoId].append(r)
        by_video_per_tab.append(by_v)
        video_sets.append(set(by_v.keys()))

    common = set.intersection(*video_sets) if video_sets else set()
    if not common:
        return all_results[0]

    output: list[SearchResult] = []
    for video_id in common:
        last_frame = -1
        chosen_frames = []
        ok = True
        for by_v in by_video_per_tab:
            # Ưu tiên frame sau last_frame, score cao hơn
            candidates = sorted(
                by_v[video_id],
                key=lambda x: (x.selectedFrame <= last_frame, -x.score, x.selectedFrame),
            )
            picked = None
            for c in candidates:
                if c.selectedFrame > last_frame:
                    picked = c
                    break
            if picked is None:
                ok = False
                break
            chosen_frames.append(picked)
            last_frame = picked.selectedFrame

        if not ok or not chosen_frames:
            continue

        avg_score = sum(f.score for f in chosen_frames) / len(chosen_frames)
        rep = chosen_frames[0].model_copy(update={"score": float(avg_score)})
        output.append(rep)

    output.sort(key=lambda x: x.score, reverse=True)
    return output


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
    

