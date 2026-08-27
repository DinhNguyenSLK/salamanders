from schemas import SearchParams, QueryItems, ParamItems
from unidecode import unidecode

class QueryObj:
    def __init__(
            self,
            query: QueryItems,
            parameter: ParamItems,

    ):   
        self.query = query
        self.parameter = parameter

        self.query_dict = query.model_dump()
        self.parameter_dict = parameter.model_dump()

    def get(self, query_type: str):
        return self.query_dict.get(query_type, None)
    
    def get_mode(self, mode_name):
        return self.parameter_dict.get(mode_name, None)
    
    def parseVf(self):
        return {
            "imgId": self.query.vf
        }

    def parseQbe(self):
        return {
            "image_input": self.query.qbe
        }

    def parseTextual(self):
        return {
            "textual": self.query.textual,
            "mode": self.parameter.textual_model
        }

    def parsePos(self):
        return {
            "field" : "object_pos",
            "value" : self.query.object_pos,
            "operator" : self.parameter.operator
        }

    def parseOcr(self):
        return {
            "field": "ocr",
            "fuzziness": self.parameter.ocr_fuzziness,
            "operator": self.parameter.ocr_operator,
            "value": unidecode(self.query.ocr.lower().strip())
        }

    def parseAsr(self):
        return {
            "field": "asr",
            "fuzziness": self.parameter.asr_fuzziness,
            "operator": self.parameter.asr_operator,
            "value": unidecode(self.query.asr.lower().strip())
        }

    def parseTags(self):
        return {
            "field": "tags",
            "value": self.query.tags,
        }

    def parseObjCount(self):
        return {
            "field": "object_count",
            "value": self.query.object_count,
            "range" : self.parameter.range
        }

    

    

class QueryParser:
    def __init__(
            self, 
            params: SearchParams
    ):
        self.params = params
        self.num_tab = len(params.query)

    def get(self, tab: int) -> QueryObj:
        query = self.params.query[tab]
        parameter = self.params.parameters[tab]

        return QueryObj(
                    query = query,
                    parameter=parameter
        )
