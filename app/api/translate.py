from deep_translator import GoogleTranslator
from google.cloud import translate_v2 as translate
from google.oauth2 import service_account
import time

def translate_free(text: str, source: str = 'vi', target: str = 'en'):
    
    translated = GoogleTranslator(source=source, target=target).translate(text) 
    print("text: ", text,' - Translated: ', translated)
    return translated

class Translator():

    def __init__(
            self,
            source: str = "vi",
            target: str = "en",
            KEY_FILE: str = r"G:\salamanders\app\api\google-translate.json"
    ):
        self.source = source
        self.target = target

        credentials = service_account.Credentials.from_service_account_file(KEY_FILE)

        self.client = translate.Client(credentials=credentials)

    def translate(self, text: str):
        
        try:
            result = self.client.translate(
                text,
                source_language=self.source,
                target_language=self.target
            )
            return result["translatedText"]
        except:
            return translate_free(text)
    
if __name__ == "__main__":
    import time

    s = time.perf_counter()
    tran = Translator()
    print("init:", time.perf_counter() - s)

    for i in range(5):
        s = time.perf_counter()

        result = tran.translate(
            "Xin chào các bạn các bạn là ai v"
        )

        print(
            f"{i}: {time.perf_counter() - s:.3f}s -> {result}"
        )