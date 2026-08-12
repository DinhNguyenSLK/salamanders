import requests

url = "http://192.168.28.151:5000/api/v2/submit/d1ed5c2b-7091-4f87-bc40-b87718da9ba6"
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



if __name__ == "__main__":
    submit_KIS(
        video_id=  "L29_V014"  ,
        start_ms=   83520,
        end_ms=     100000
    )