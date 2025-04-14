import { LightningElement, track } from 'lwc';
import getGeminiResponse from '@salesforce/apex/ChatBotHandler.getGeminiResponse';

export default class ChatBot extends LightningElement {
    @track question = '';
    @track answer = '';
    @track questionHistory = [];
    @track showHistory = false;
    @track showAnswer = false;
    isLoading = false ;

    handleInputChange(event) {
        this.question = event.detail.value;
        this.answer = '';
    }
    renderedCallback() {
        // Render latest answer
        if (this.showAnswer && this.answer) {
            const answerDiv = this.template.querySelector('.answer-section .ai-answer');
            if (answerDiv) {
                answerDiv.innerHTML = this.answer;
            }
        }
    
        // Render history answers
        if (this.showHistory) {
            this.questionHistory.forEach((q) => {
                const historyDiv = this.template.querySelector(`.history-item [data-id="${q.id}"]`);
                if (historyDiv) {
                    historyDiv.innerHTML = q.answer;
                }
            });
        }
    }
    

    handleSubmit() {
        this.isLoading = true
        if (this.question.trim() === '') {
            this.answer = 'Please enter a valid question.';
            return;
        }

        getGeminiResponse({ question: this.question })
            .then((result) => {
                console.log('Result:', result);
                this.answer = this.formatResponse(result);
                 // Format answer
                this.isLoading = false ;
                this.showAnswer = true;

                this.questionHistory.unshift({
                    id: this.questionHistory.length + 1,
                    text: this.question,
                    answer: this.formatResponse(result) // Save formatted answer
                });

                this.question = '';
            })
            .catch((error) => {
                console.error('Error:', error);
                this.answer = 'An error occurred while fetching the answer.';
            });
    }

    handleClear() {
        this.question = '';
        this.answer = '';
        this.showAnswer = false;
    }

    toggleHistory() {
        this.showHistory = !this.showHistory;
        this.showAnswer = false;
    }

    formatResponse(text) {
        if (!text) return '';

        let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        formatted = formatted.replace(/(?:\n|^)[ \t]*\* (.+)/g, '<li>$1</li>');
        formatted = formatted.replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>');

        formatted = formatted.replace(/\n{2,}/g, '</p><p>');
        formatted = `<p>${formatted}</p>`;

        formatted = formatted.replace(/<strong>(\d+\..+?)<\/strong>/g, '<h3>$1</h3>');

        return formatted;
    }
    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSubmit();
        }
    }
    
}
