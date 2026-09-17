"""Exercise route orchestration without starting Elasticsearch or model services."""
import ast
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, Mock


class SceneImageSearchTests(unittest.IsolatedAsyncioTestCase):
    async def test_images_merge_with_text_and_reach_every_temporal_scene(self):
        source = Path(__file__).parents[1] / "app/routes/search.py"
        tree = ast.parse(source.read_text(encoding="utf-8"))
        route = next(node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.name == "search")
        route.decorator_list = []
        # Keep the actual route body; isolate only its external dependencies.
        module = ast.Module(body=[
            ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0),
            route,
        ], type_ignores=[])
        ast.fix_missing_locations(module)

        class Query(dict):
            def parseQbe(self):
                return self["qbe"]

            def parseTextual(self):
                return self["textual"]

        scenes = [Query(qbe="first-image", textual="red car"), Query(qbe="second-image")]
        params = SimpleNamespace(k=100, n_frames_per_round=10, rearrange=True, video_type="all")
        parser = SimpleNamespace(params=params, num_tab=2, get=scenes.__getitem__)
        vector = Mock()
        vector.search.side_effect = lambda channel, query, k: [query]
        merge = Mock(side_effect=lambda channels: [item for results in channels.values() for item in results])
        temporal = Mock(return_value=["combined-scenes"])
        slice_results = Mock(return_value=["final-results"])
        scope = dict(
            QueryParser=lambda _: parser,
            get_video_type_filter=AsyncMock(return_value=None),
            index_name="test", vector_search=vector,
            _merge=merge, _filter=lambda results, _: results,
            _temporal=temporal, _slice=slice_results,
            time=SimpleNamespace(time=lambda: 0), print=lambda *args: None,
        )
        exec(compile(module, str(source), "exec"), scope)
        self.assertEqual(await scope["search"](params, None), ["final-results"])
        self.assertEqual(merge.call_args_list[0].args[0], {
            "qbe": ["first-image"], "textual": ["red car"],
        })
        self.assertEqual(merge.call_args_list[1].args[0], {"qbe": ["second-image"]})
        temporal.assert_called_once_with([["first-image", "red car"], ["second-image"]])
        slice_results.assert_called_once_with(["combined-scenes"], 10, True)


if __name__ == "__main__":
    unittest.main()
