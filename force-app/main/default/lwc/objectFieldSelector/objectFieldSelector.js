import { LightningElement, track, wire } from 'lwc';
import { createRecord } from "lightning/uiRecordApi";
import RECORD_SUMMARY_OBJECT from '@salesforce/schema/Record_Summary_Config__c';
import OBJECT_NAME from '@salesforce/schema/Record_Summary_Config__c.Object_Name__c';
import OBJECT_FIELD_JSON from '@salesforce/schema/Record_Summary_Config__c.Object_and_Field_JSON__c';
import getAllObjects from '@salesforce/apex/MetaDataService.getAllObjects';
import getObjectFields from '@salesforce/apex/MetaDataService.getObjectFields';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ObjectFieldLookup extends LightningElement {
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

    @track selectedObjectFieldsMap = {};

    successMessage = '';
    errorMessage = '';

    @wire(getAllObjects)
    wiredObjects({ data, error }) {
        if (data) {
            this.allObjects = data.map(obj => ({ label: obj, value: obj }));
            this.filteredObjects = [...this.allObjects];
        } else if (error) {
            console.error('Error fetching objects:', error);
        }
    }

    handleObjectSearch(event) {
        this.objectSearchText = event.target.value;
        this.filteredObjects = this.allObjects.filter(obj =>
            obj.label.toLowerCase().includes(this.objectSearchText.toLowerCase())
        );
        this.showObjectDropdown = true;
    }

    selectObject(event) {
        this.selectedObject = event.currentTarget.dataset.value;
        this.objectSearchText = this.selectedObject;
        this.showObjectDropdown = false;

        this.selectedFields = [];
        this.fieldSearchText = '';

        getObjectFields({ objectName: this.selectedObject })
            .then(data => {
                this.allFields = data.map(field => ({ label: field, value: field }));
                this.filteredFields = [...this.allFields];
            })
            .catch(error => {
                console.error('Error fetching fields:', error);
            });
    }

    handleFieldSearch(event) {
        this.fieldSearchText = event.target.value;
        this.filteredFields = this.allFields.filter(field =>
            field.label.toLowerCase().includes(this.fieldSearchText.toLowerCase())
        );
        this.showFieldDropdown = true;
    }

    selectField(event) {
        const selectedField = event.currentTarget.dataset.value;
        if (!this.selectedFields.includes(selectedField)) {
            this.selectedFields = [...this.selectedFields, selectedField];
        }
        this.fieldSearchText = '';
        this.showFieldDropdown = false;
    }

    removeField(event) {
        const fieldToRemove = event.currentTarget.dataset.field;
        this.selectedFields = this.selectedFields.filter(field => field !== fieldToRemove);
    }

    toggleObjectDropdown() {
        this.showObjectDropdown = !this.showObjectDropdown;
    }

    toggleFieldDropdown() {
        this.showFieldDropdown = !this.showFieldDropdown;
    }

    handleAddMore() {
        if (this.selectedObject && this.selectedFields.length > 0) {
            this.selectedObjectFieldsMap = JSON.parse(JSON.stringify({
                ...this.selectedObjectFieldsMap,
                [this.selectedObject]: [...this.selectedFields]
            }));
            console.log('Selected Object-Field Map:', JSON.stringify(this.selectedObjectFieldsMap));
        }

        this.selectedObject = '';
        this.selectedFields = [];
        this.objectSearchText = '';
        this.fieldSearchText = '';
    }

    handleDone() {
        if (this.selectedObject && this.selectedFields.length > 0) {
            this.selectedObjectFieldsMap = {
                ...this.selectedObjectFieldsMap,
                [this.selectedObject]: [...this.selectedFields]
            };
        }

        const fields = {};
        fields[OBJECT_NAME.fieldApiName] = Object.keys(this.selectedObjectFieldsMap)[0];
        fields[OBJECT_FIELD_JSON.fieldApiName] = JSON.stringify(this.selectedObjectFieldsMap, null, 2);

        const recordInput = {
            apiName: RECORD_SUMMARY_OBJECT.objectApiName,
            fields
        };

        createRecord(recordInput)
            .then(result => {
                this.successMessage = 'Record created successfully!';
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: this.successMessage,
                    variant: 'success',
                }));

                // Reset everything to initial state
                this.selectedObject = '';
                this.selectedFields = [];
                this.objectSearchText = '';
                this.fieldSearchText = '';
                this.showObjectDropdown = false;
                this.showFieldDropdown = false;
                this.selectedObjectFieldsMap = {};
                this.filteredObjects = [...this.allObjects];
                this.filteredFields = [];
                this.allFields = [];
            })
            .catch(error => {
                this.errorMessage = `Error creating record: ${error.body.message}`;
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: this.errorMessage,
                    variant: 'error',
                }));
            });

        console.log('Final Object-Field Map:', JSON.stringify(this.selectedObjectFieldsMap, null, 2));
    }

    handleCancel() {
        this.selectedObject = '';
        this.selectedFields = [];
        this.selectedObjectFieldsMap = {};
    }

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
