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
                Schema.DescribeFieldResult fieldDescribe = fields.get(fieldName).getDescribe();

                fieldsName.add(fieldName);
                if(fieldDescribe.getType() == Schema.DisplayType.REFERENCE){
                    List<Schema.SObjectType> referenceTo = fieldDescribe.getReferenceTo();                    if(referenceTo.size() > 0){
                        String relatedObject = referenceTo[0].getDescribe().getName();
                        Map<String, Schema.SObjectField> relatedFields = Schema.getGlobalDescribe().get(relatedObject).getDescribe().fields.getMap();
    
                        // Add top-level fields from related object as nested fields
                        for(String relatedFieldName : relatedFields.keySet()){
                            fieldsName.add(fieldName.replace('id', '') + '.' + relatedFieldName); // e.g., Account.Name
                        }
                    }



        }
    }
}
        
        return fieldsName;



        



    }
}