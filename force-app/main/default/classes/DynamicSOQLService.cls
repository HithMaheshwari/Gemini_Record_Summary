public with sharing class DynamicSOQLService {
    public static String generateSOQLQuery(String jsonInput) {
        try {
            // Deserialize JSON into a raw untyped map
            Map<String, Object> rawQueryMap = (Map<String, Object>) JSON.deserializeUntyped(jsonInput);
            Map<String, List<String>> queryMap = new Map<String, List<String>>();

            // Convert Object values to List<String> safely
            for (String key : rawQueryMap.keySet()) {
                List<Object> objList = (List<Object>) rawQueryMap.get(key);
                List<String> strList = new List<String>();
                for (Object field : objList) {
                    strList.add((String) field);
                }
                queryMap.put(key, strList);
            }

            // Identify base object
            String baseObject = queryMap.keySet().iterator().next();
            List<String> baseFields = queryMap.get(baseObject);

            // Fetch relationships (handling custom objects properly)
            Map<String, String> relationshipMap = getChildRelationshipsIterative(queryMap.keySet());

            // Construct nested SOQL
            String soqlQuery = generateSOQL(baseObject, baseFields, queryMap, relationshipMap);

            System.debug('Generated SOQL: ' + soqlQuery);
            return soqlQuery;

        } catch (Exception e) {
            System.debug('Error while generating query: ' + e.getMessage());
            return null;
        }
    }

    private static Map<String, String> getChildRelationshipsIterative(Set<String> objectNames) {
        Map<String, String> relationshipMap = new Map<String, String>();

        for (String objectName : objectNames) {
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectName);
            Schema.DescribeSObjectResult objDescribe = objType.getDescribe();

            for (Schema.ChildRelationship rel : objDescribe.getChildRelationships()) {
                if (rel.getRelationshipName() != null) { 
                    String childObjectName = rel.getChildSObject().getDescribe().getName();
                    
                    if (childObjectName.endsWith('__c')) {
                        relationshipMap.put(childObjectName, rel.getRelationshipName());
                    } else {
                        relationshipMap.put(childObjectName, rel.getRelationshipName());
                    }
                }
            }
        }

        return relationshipMap;
    }
    private static String generateSOQL(String objectName, List<String> fields, Map<String, List<String>> queryMap, Map<String, String> relationshipMap) {
        String query = 'SELECT ' + String.join(fields, ', ');

        List<String> subQueries = new List<String>();

        for (String childObject : queryMap.keySet()) {
            if (relationshipMap.containsKey(childObject)) {
                String relationshipName = relationshipMap.get(childObject);
                List<String> relatedFields = queryMap.get(childObject);

                // Recursively build subqueries only for valid relationships
                subQueries.add('(SELECT ' + String.join(relatedFields, ', ') + ' FROM ' + relationshipName + ')');
            }
        }

        if (!subQueries.isEmpty()) {
            query += ', ' + String.join(subQueries, ', ');
        }

        query += ' FROM ' + objectName;
        return query;
    }
}