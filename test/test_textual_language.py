"""Language routing and caching, with translation/vector services mocked."""
import ast
import importlib.util
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from pydantic import ValidationError


APP = Path(__file__).resolve().parents[1] / "app"
sys.path.insert(0, str(APP))

from schemas import ParamItems, QueryItems, SearchParams
from cache.memory_cache import MemoryCache


def load_module(name, relative_path):
    spec = importlib.util.spec_from_file_location(name, APP / relative_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


with patch.dict(sys.modules, {
    "config": SimpleNamespace(settings=SimpleNamespace(VECTORSEARCH_URL="https://vector.invalid")),
}):
    vector_module = load_module("language_vector", "search_engine/faiss/vector_search.py")
parser_module = load_module("language_parser", "search_engine/query_parser.py")


class TextualLanguageTests(unittest.TestCase):
    def test_default_and_invalid_languages(self):
        self.assertEqual(ParamItems().textual_language, "vi")
        with self.assertRaises(ValidationError):
            ParamItems(textual_language="fr")

    @patch.object(vector_module.requests, "post")
    @patch.object(vector_module, "Translator")
    def test_english_never_initializes_or_calls_translation(self, translator, post):
        translator.side_effect = AssertionError("Translation must not be used")
        post.return_value.json.return_value = []
        query = parser_module.QueryObj(
            QueryItems(textual="A Red Car beside a café"),
            ParamItems(textual_language="en"),
        ).parseTextual()
        original = dict(query)
        engine = vector_module.APIVectorSearch()
        self.assertEqual(engine.search("textual", query, 100), [])
        translator.assert_not_called()
        post.assert_called_once_with("https://vector.invalid/textual", json={
            "textual": "A Red Car beside a café", "mode": "siglip2", "k": 100,
        })
        self.assertEqual(query, original)

    @patch.object(vector_module.requests, "post")
    @patch.object(vector_module, "Translator")
    def test_vietnamese_still_translates_and_reuses_client(self, translator, post):
        post.return_value.json.return_value = []
        translator.return_value.translate.return_value = "a red car"
        engine = vector_module.APIVectorSearch()
        query = {"textual": "một chiếc xe đỏ", "mode": "align"}
        engine.search("textual", query, 100)
        engine.search("textual", query, 100)
        translator.assert_called_once_with()
        self.assertEqual(translator.return_value.translate.call_count, 2)
        self.assertEqual(post.call_args.kwargs["json"]["textual"], "a red car")
        self.assertEqual(query["textual"], "một chiếc xe đỏ")


class LanguageCacheRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_same_text_uses_separate_language_caches(self):
        # Run the real route, parser, cache and vector wrapper without live services.
        source = APP / "routes/search.py"
        tree = ast.parse(source.read_text(encoding="utf-8"))
        route = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == "search")
        route.decorator_list = []
        module = ast.Module(body=[
            ast.ImportFrom(module="__future__", names=[ast.alias(name="annotations")], level=0),
            route,
        ], type_ignores=[])
        ast.fix_missing_locations(module)
        translator = Mock()
        translator.translate.return_value = "translated query"
        scope = dict(
            QueryParser=parser_module.QueryParser,
            vector_search=vector_module.APIVectorSearch(translator=translator),
            MEMORY_CACHE=MemoryCache(),
            _merge=lambda channels: channels["textual"],
            _filter=lambda results, *_: results,
            _temporal=lambda scenes: scenes[0],
            _slice=lambda results, *_: results,
            time=SimpleNamespace(time=lambda: 0), print=lambda *args: None,
        )
        exec(compile(module, str(source), "exec"), scope)
        with patch.object(vector_module.requests, "post") as post:
            post.return_value.json.return_value = []
            for language in ("vi", "en", "vi", "en"):
                params = SearchParams(
                    query=[QueryItems(textual="same query")],
                    parameters=[ParamItems(textual_language=language)], k=100,
                )
                self.assertEqual(await scope["search"](params, None), [])
            self.assertEqual(post.call_count, 2)
            self.assertEqual([c.kwargs["json"]["textual"] for c in post.call_args_list],
                             ["translated query", "same query"])
            translator.translate.assert_called_once_with("same query")


if __name__ == "__main__":
    unittest.main()
