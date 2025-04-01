public with sharing class MetaDataService {
    @AuraEnabled(cacheable = true)
    public static List<String> getAllObjects(){
        List<String> objects = new List<String>();
        for(Schema.SObjectType objTyp :Schema.getGlobalDescribe().values()){
            objects.add(objTyp.getDescribe().getName());
        }
        return objects ;
    }
    @AuraEnabled (cacheable = true)
    public static List<String> getObjectFields(String objectName){
        List<String> fieldsName  = new List<String>();
        if(Schema.getGlobalDescribe().containsKey(objectName)){
            Schema.SObjectType objTyp = Schema.getGlobalDescribe().get(objectName);
            Map<String,Schema.SObjectField> fields = objTyp.getDescribe().fields.getMap();
            for(String fieldName : fields.KeySet()){
                fieldsName.add(fieldName);
            }


        }
        
        return fieldsName;



        



    }
}