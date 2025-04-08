public class RecordSummaryService {
    @AuraEnabled
    public static String getData(Id recordId){
        Schema.SObjectType objType = recordId.getSObjectType();
        String objectTypeName = objType.getDescribe().getName();
        Record_Summary_Config__c objectConfig = [SELECT Id, Name, Object_and_Field_JSON__c,Object_Name__c FROM
                                                 Record_Summary_Config__c WHERE Object_Name__c =: objectTypeName];
        String soqlQuery = DynamicSOQLService.generateSOQLQuery(objectConfig.Object_and_Field_JSON__c);
        
        String finalQuery = soqlQuery+' WHERE Id = \''+ recordId +'\'';
        System.debug('Final Query:'+finalQuery);
        List<SObject> records = Database.query(finalQuery);
        String jsonOutput = JSON.serialize(records);
        System.debug('JSON Output: ' + jsonOutput);
        
        //Make Callout
        List<API_Key__mdt> metadataRecords = [SELECT MasterLabel,Key__c,URL__c FROM API_Key__mdt  WHERE MasterLabel = 'Gemini API'];
        String key = metadataRecords[0].Key__c;
        String url = metadataRecords[0].URL__c+key;
        String prompt = 'Frame Summary for sales person that could be helpful for him during the Customer Call and New actions for Business with this detail: ';
        
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndPoint('callout:Gemini_Named_Creds'+url);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        Map<String, Object> jsonRequest = new Map<String, Object>{
            'contents' => new List<Object>{
                new Map<String, Object>{
                    'parts' => new List<Object>{
                        new Map<String, Object>{
                            'text' => prompt + '\n' + jsonOutput
                                }
                    }
                }
            }
        };
            String requestBody = JSON.serialize(jsonRequest);
        req.setBody(requestBody);        
        HttpResponse res = new HttpResponse();
        res = http.send(req);
        Integer statusCode = res.getStatusCode();
        ParseJson parseJsonObj = (ParseJson)JSON.deserialize(res.getBody(), ParseJson.class);
        String answer = '';
        if(statusCode == 200){
            answer += parseJsonObj.candidates[0].content.parts[0].text;
        }else{
            answer ='An Exception has occured! Please use the Request Again Button after sometime to regenerate the Summary';
        }
        System.debug('Answer::'+answer);
        return answer;
    }
    public class ParseJson{
        public List<Candidates> candidates ;
        public UsageMetadata usageMetadata ;
        public string modelVersion  ;
    }
    public class Candidates{
        public Content content ;
        public string finishReason ;
        public string avgLogprobs ;
    }
    public class Content {
        public List<Parts> parts ;
        public String role ;
    }
    public class Parts {
        public String text ;
        
    }
    public class UsageMetadata {
        public Integer promptTokenCount;
        public Integer candidatesTokenCount;
        public Integer totalTokenCount;
    }
}