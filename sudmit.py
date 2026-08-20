import requests

evaluation_id = "8467dad2-45e5-4fad-ab44-0fb1bd869eb5"
url = f"http://192.168.28.151:5000/api/v2/submit/{evaluation_id}"
session_id = "CaHbbfLxH_2Er4X85lbC8yd9qSiEAc1F"


def submit_KIS(
        video_id,
        start_ms,
        end_ms
):
    payload = {
        "answerSets": [
            {
                "answers": [
                    {
                        "mediaItemName": video_id,
                        "start": start_ms,
                        "end": end_ms
                    }
                ]
            }
        ]
    }

    response = requests.post(
        url,
        params={"session": session_id},
        json=payload
    )

    print(response.status_code)
    print(response.text)


def submit_QA(
        text
):
    payload = {
            "answerSets": [
                {
                    "answers": [
                        {
                            "text": text
                        }
                    ]
                }
            ]
        }
    
    response = requests.post(
        url,
        params={"session": session_id},
        json=payload
    )
    
if __name__ == "__main__":
    submit_QA(
        "6768"
    )