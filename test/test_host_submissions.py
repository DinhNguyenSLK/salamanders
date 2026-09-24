"""The first click must never contact DRES; only an explicit claimed item may."""

import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "app"))
from routes.host_submissions import router  # noqa: E402
from submission_settings import SubmissionSettings, get_submission_settings  # noqa: E402


class HostSubmissionTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router)
        settings = SubmissionSettings(
            host_submissions_url="https://host.example",
            host_submissions_api_key="private-member-key",
            dres_endpoint="https://dres.example",
            dres_session_id="private-session",
            dres_evaluation_id="evaluation-1",
        )
        app.dependency_overrides[get_submission_settings] = lambda: settings
        self.client = TestClient(app)

    @staticmethod
    def reply(status, body):
        response = Mock()
        response.status_code = status
        response.ok = 200 <= status < 300
        response.json.return_value = body
        return response

    def test_first_click_saves_only_on_host(self):
        item = {"id": "919565a8-314c-4201-90cd-7b744e3fbab6", "status": "pending"}
        with patch("routes.host_submissions.requests.request", return_value=self.reply(201, item)) as host, patch(
            "routes.host_submissions.requests.post"
        ) as dres:
            response = self.client.post("/host-submissions", json={
                "file_name": "query-kis", "query_content": "find this",
                "img_id": 1, "video_id": "video1", "frame_id": "video1-000001",
                "start_ms": 1000, "end_ms": 1000,
            }, headers={"Origin": "http://127.0.0.1:8000", "Idempotency-Key": "once"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "pending")
        dres.assert_not_called()
        self.assertEqual(host.call_args.kwargs["headers"]["X-API-Key"], "private-member-key")
        self.assertEqual(host.call_args.kwargs["headers"]["Idempotency-Key"], "once")
        self.assertNotIn("private-member-key", str(response.json()))

    def test_dres_requires_host_claim(self):
        item_id = "919565a8-314c-4201-90cd-7b744e3fbab6"
        with patch("routes.host_submissions.requests.request", return_value=self.reply(409, {"error": "Already claimed"})), patch(
            "routes.host_submissions.requests.post"
        ) as dres:
            response = self.client.post(f"/host-submissions/{item_id}/submit-dres")
        self.assertEqual(response.status_code, 409)
        dres.assert_not_called()

    def test_claim_then_complete(self):
        item_id = "919565a8-314c-4201-90cd-7b744e3fbab6"
        claim = {"claimToken": "7c75e29d-1b14-4cb6-b6ef-0fb3ca0f72e4", "dresPayload": {"answerSets": []}}
        host_replies = [self.reply(200, claim), self.reply(200, {"id": item_id, "status": "submitted"})]
        dres_reply = Mock(status_code=200, ok=True, text="accepted")
        with patch("routes.host_submissions.requests.request", side_effect=host_replies) as host, patch(
            "routes.host_submissions.requests.post", return_value=dres_reply
        ) as dres:
            response = self.client.post(f"/host-submissions/{item_id}/submit-dres")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["submission"]["status"], "submitted")
        self.assertEqual(dres.call_count, 1)
        self.assertEqual(host.call_count, 2)
        self.assertEqual(host.call_args.kwargs["json"]["claimToken"], claim["claimToken"])

    def test_edited_json_is_sent_to_dres(self):
        item_id = "919565a8-314c-4201-90cd-7b744e3fbab6"
        claim = {"claimToken": "7c75e29d-1b14-4cb6-b6ef-0fb3ca0f72e4", "dresPayload": {"original": True}}
        edited = {"answerSets": [{"answers": [{"mediaItemName": "L28_V023", "start": 123, "end": 456}]}]}
        host_replies = [self.reply(200, claim), self.reply(200, {"id": item_id, "status": "submitted"})]
        dres_reply = Mock(status_code=200, ok=True, text="accepted")
        with patch("routes.host_submissions.requests.request", side_effect=host_replies), patch(
            "routes.host_submissions.requests.post", return_value=dres_reply
        ) as dres:
            response = self.client.post(
                f"/host-submissions/{item_id}/submit-dres",
                json={"dres_payload": edited},
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(dres.call_args.kwargs["json"], edited)

    def test_disallowed_browser_origin(self):
        response = self.client.get("/host-submissions", headers={"Origin": "https://other.example"})
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
