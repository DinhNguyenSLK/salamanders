from deep_translator import GoogleTranslator

def translate(text: str, source: str = 'vi', target: str = 'en'):
    
    translated = GoogleTranslator(source=source, target=target).translate(text) 
    print("text: ", text,' - Translated: ', translated)
    return translated

if __name__ == "__main__":
    text = "Trao đổi với phóng viên, ông Hòa cho biết giếng nước này được ông khoan để tìm nước tưới"
    translate(text)