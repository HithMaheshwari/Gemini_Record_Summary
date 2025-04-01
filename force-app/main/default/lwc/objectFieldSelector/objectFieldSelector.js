import { LightningElement, track, wire } from 'lwc';
import {createRecord} from "lightning/uiRecordApi"
import RECORD_SUMMARY_OBJECT from '@salesforce/schema/Record_Summary_Config__c'
import OBJECT_NAME from '@salesforce/schema/Record_Summary_Config__c.Object_Name__c'
import OBJECT_FIELD_JSON from '@salesforce/schema/Record_Summary_Config__c.Object_and_Field_JSON__c'
import getAllObjects from '@salesforce/apex/MetaDataService.getAllObjects';
import getObjectFields from '@salesforce/apex/MetaDataService.getObjectFields';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class ObjectFieldLookup extends LightningElement {
    // Object and Field Lookup
    @track allObjects = [];
    @track filteredObjects = [];
    selectedObject = '';
    objectSearchText = '';
    showObjectDropdown = false;

    @track allFields = [];
    @track filteredFields = [];
    @track selectedFields = [];
    fieldSearchText = '';
    showFieldDropdown = false;

    

    // Map to store Objects and Selected Fields
    @track selectedObjectFieldsMap = {};

     //Toast Message
     successMessage = '' ;
     errorMessage = ''

    // Fetch all objects from Apex
    @wire(getAllObjects)
    wiredObjects({ data, error }) {
        if (data) {
            this.allObjects = data.map(obj => ({ label: obj, value: obj }));
            this.filteredObjects = [...this.allObjects];
        } else if (error) {
            console.error('Error fetching objects:', error);
        }
    }

    // Handle Object Search
    handleObjectSearch(event) {
        this.objectSearchText = event.target.value;
        this.filteredObjects = this.allObjects.filter(obj =>
            obj.label.toLowerCase().includes(this.objectSearchText.toLowerCase())
        );
        this.showObjectDropdown = true;
    }

    // Handle Object Selection
    selectObject(event) {
        this.selectedObject = event.currentTarget.dataset.value;
        this.objectSearchText = this.selectedObject;
        this.showObjectDropdown = false;

        // Reset fields when a new object is selected
        this.selectedFields = [];
        this.fieldSearchText = '';

        // Fetch fields for the selected object
        getObjectFields({ objectName: this.selectedObject })
            .then(data => {
                this.allFields = data.map(field => ({ label: field, value: field }));
                this.filteredFields = [...this.allFields];
            })
            .catch(error => {
                console.error('Error fetching fields:', error);
            });
    }

    // Handle Field Search
    handleFieldSearch(event) {
        this.fieldSearchText = event.target.value;
        this.filteredFields = this.allFields.filter(field =>
            field.label.toLowerCase().includes(this.fieldSearchText.toLowerCase())
        );
        this.showFieldDropdown = true;
    }

    // Handle Multi-Select Field Selection
    selectField(event) {
        const selectedField = event.currentTarget.dataset.value;
        if (!this.selectedFields.includes(selectedField)) {
            this.selectedFields = [...this.selectedFields, selectedField];
        }
        this.fieldSearchText = '';
        this.showFieldDropdown = false;
    }

    // Remove Field
    removeField(event) {
        const fieldToRemove = event.currentTarget.dataset.field;
        this.selectedFields = this.selectedFields.filter(field => field !== fieldToRemove);
    }

    // Toggle Dropdowns
    toggleObjectDropdown() {
        this.showObjectDropdown = !this.showObjectDropdown;
    }

    toggleFieldDropdown() {
        this.showFieldDropdown = !this.showFieldDropdown;
    }

     
    handleAddMore() {
        if (this.selectedObject && this.selectedFields.length > 0) {
            // Store object and selected fields in map
            this.selectedObjectFieldsMap = JSON.parse(JSON.stringify({
                ...this.selectedObjectFieldsMap,
                [this.selectedObject]: [...this.selectedFields]
            }));
            console.log(
                'Selected Object-Field Map:',
                JSON.stringify(this.selectedObjectFieldsMap));
        }

        // Reset for new object selection
        this.selectedObject = '';
        this.selectedFields = [];
        this.objectSearchText = '';
        this.fieldSearchText = '';
    }

    // Handle "Done" button
    handleDone() {
        if (this.selectedObject && this.selectedFields.length > 0) {
            // Store last selected object before finishing
            this.selectedObjectFieldsMap = {
                ...this.selectedObjectFieldsMap,
                [this.selectedObject]: [...this.selectedFields]
            };
        }

        const fields = {};
        fields[OBJECT_NAME.fieldApiName] = Object.keys(this.selectedObjectFieldsMap)[0];
        fields[OBJECT_FIELD_JSON.fieldApiName] = JSON.stringify(this.selectedObjectFieldsMap, null, 2);
        const recordInput = {apiName : RECORD_SUMMARY_OBJECT.objectApiName , fields}
        createRecord(recordInput).then(result=>{
            this.successMessage = 'Record created successfully!';
            this.dispatchEvent(new ShowToastEvent({
                        title: 'Success',
                        message:  this.successMessage,
                        variant: 'success',
            }))


        }).catch(error=>{
            this.errorMessage = `Error creating record: ${error.body.message}`;
            this.dispatchEvent(new ShowToastEvent({
                        title: 'Error',
                        message: this.error,
                        variant: 'error',
            }))

        })

        console.log('Final Object-Field Map:', JSON.stringify(this.selectedObjectFieldsMap, null, 2));
        // You can send this data to Apex or use it elsewhere
    }

    // Handle "Cancel" button
    handleCancel() {
        this.selectedObject = '';
        this.selectedFields = [];
        this.selectedObjectFieldsMap = {};
    }

    // CSS Classes for Dropdown
    get objectDropdownClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.showObjectDropdown ? 'slds-is-open' : ''}`;
    }

    get fieldDropdownClass() {
        return `slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${this.showFieldDropdown ? 'slds-is-open' : ''}`;
    }

    get objectFieldsList() {
        return Object.entries(this.selectedObjectFieldsMap).map(([object, fields]) => ({
            objectName: object,
            fields: fields.join(', ')
        }));
    }

}