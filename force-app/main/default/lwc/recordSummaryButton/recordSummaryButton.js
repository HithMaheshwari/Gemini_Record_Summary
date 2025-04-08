import { LightningElement, api, track } from 'lwc';
import getData from '@salesforce/apex/RecordSummaryService.getData';

export default class RecordSummaryButton extends LightningElement {
    @api recordId;
    @track rawResponse = '';
    @track showButton = true;
    @track errorMessage = '';
    @track formattedData = '';
    @track isLoading = false;

    handleClick() {
        console.log("Record Id::", this.recordId);
        this.isLoading = true;

        getData({ recordId: this.recordId })
            .then(result => {
                console.log("Answer ::", result);
                this.isLoading = false;

                if (result) {
                    this.rawResponse = result;
                    this.formattedData = this.formatResponse(result);
                    this.showButton = false;
                } else {
                    this.errorMessage = "No response received.";
                }
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                this.errorMessage = "Failed to fetch summary. Please try again.";
            });
    }

    formatResponse(rawText) {
        if (!rawText) {
            console.error("Raw text is empty or undefined");
            return "";
        }

        let formattedText = rawText
            .replace('## Frame Summary for Sales Call with', '')
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n\n/g, "<br/><br/>")
            .replace(/\* (.*?)\n/g, "<li>$1</li>")
            .replace(/(Call Objectives:|New Actions for Business:)/g, "<br/><strong>$1</strong>")
            .replace(/<li>/g, "<ul><li>")
            .replace(/<\/li>(?!<li>)/g, "</li></ul>")
            .replace(/(<ul><li>.*?<\/li>)/g, "<ul>$1</ul>");

        return formattedText;
    }

    renderedCallback() {
        const contentDiv = this.template.querySelector(".formatted-content");
        if (contentDiv) {
            contentDiv.innerHTML = this.formattedData;
        }
    }

    handleCopy() {
        if (!this.formattedData) {
            alert('Nothing to copy!');
            return;
        }

        // Copy formatted text to clipboard
        navigator.clipboard.writeText(this.formattedData.replace(/<[^>]+>/g, '')) // Remove HTML tags
            .then(() => {
                alert('Summary copied to clipboard!');
            })
            .catch(err => {
                console.error("Copy failed:", err);
            });
    }
}
