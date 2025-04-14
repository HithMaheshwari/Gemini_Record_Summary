public with sharing class ChatBotHandler {
    @AuraEnabled
    public static string getGeminiResponse(String question){
        String answer = '';
        List<API_Key__mdt> metadataRecords = [SELECT MasterLabel,Key__c,URL__c FROM API_Key__mdt  WHERE MasterLabel = 'Gemini API'];
        String key = metadataRecords[0].Key__c;
        String url = metadataRecords[0].URL__c+key;
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndPoint('callout:Gemini_Named_Creds'+url);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        String message = '{"contents":[{ "parts":[{"text":"' + question + '"}]}]}';
        req.setBody(message);
        HttpResponse res = new HttpResponse();
        res = http.send(req);
        system.debug('Rseponse :::'+ res.getBody());
        ParseJson parseJsonObj = (ParseJson)JSON.deserialize(res.getBody(), ParseJson.class);
        // Fetch the text value 
        answer += parseJsonObj.candidates[0].content.parts[0].text;

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