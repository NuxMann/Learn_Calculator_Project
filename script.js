class Calculator {
  constructor(previousElement, currentElement) {
    this.previousElement = previousElement;
    this.currentElement = currentElement;
    this.clear();
  }

  clear() {
    this.currentOperand = '';
    this.previousOperand = '';
    this.operation = undefined;
    this.error = '';
    this.justComputed = false;
  }

  delete() {
    if (this.error) this.error = '';
    if (this.justComputed) this.justComputed = false;
    this.currentOperand = this.currentOperand.toString().slice(0, -1);
  }

  appendNumber(number) {
    if (this.error) this.clear();
    if (this.justComputed) {
      this.currentOperand = '';
      this.justComputed = false;
    }
    if (number === '.' && this.currentOperand.includes('.')) return;
    if (this.currentOperand.length >= 18) return;
    this.currentOperand = this.currentOperand.toString() + number.toString();
  }

  chooseOperation(operation) {
    if (this.error) return;
    if (this.currentOperand === '') {
      if (this.previousOperand !== '') this.operation = operation;
      return;
    }
    if (this.previousOperand !== '') this.compute();
    if (this.error) return;
    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.currentOperand = '';
    this.justComputed = false;
  }

  compute() {
    if (!this.operation || this.currentOperand === '' || this.previousOperand === '') return false;
    const prev = Number(this.previousOperand);
    const current = Number(this.currentOperand);
    let result;
    switch (this.operation) {
      case '+': result = prev + current; break;
      case '-': result = prev - current; break;
      case '*': result = prev * current; break;
      case '÷':
        if (current === 0) {
          this.error = 'Cannot divide by zero';
          this.currentOperand = '';
          this.previousOperand = '';
          this.operation = undefined;
          return true;
        }
        result = prev / current;
        break;
      default: return false;
    }
    if (!Number.isFinite(result)) {
      this.error = 'Result is too large';
      this.currentOperand = '';
    } else {
      // Round to a precision suitable for display without exposing binary float artifacts.
      this.currentOperand = Number.parseFloat(result.toPrecision(12)).toString();
    }
    this.previousOperand = '';
    this.operation = undefined;
    this.justComputed = true;
    return true;
  }

  format(number) {
    if (number === '' || number == null) return '';
    const value = number.toString();
    const [integer, decimal] = value.split('.');
    const formattedInteger = Number(integer).toLocaleString('en-US', { maximumFractionDigits: 0 });
    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
  }

  updateDisplay(animate = false) {
    this.currentElement.textContent = this.error || this.format(this.currentOperand || '0');
    this.currentElement.classList.toggle('is-error', Boolean(this.error));
    this.currentElement.classList.toggle('is-long', !this.error && this.currentElement.textContent.length > 12);
    this.previousElement.textContent = this.operation
      ? `${this.format(this.previousOperand)} ${this.operation === '*' ? '×' : this.operation === '-' ? '−' : this.operation}`
      : '';
    document.querySelectorAll('[data-operation]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.operation === this.operation);
    });
    if (animate) {
      this.currentElement.classList.remove('is-updated');
      void this.currentElement.offsetWidth;
      this.currentElement.classList.add('is-updated');
    }
  }
}

const calculator = new Calculator(
  document.querySelector('[data-previous-operand]'),
  document.querySelector('[data-current-operand]')
);
const buttons = [...document.querySelectorAll('.key')];
document.querySelector('[data-year]').textContent = new Date().getFullYear();

function pressButton(button) {
  if (!button) return;
  button.classList.add('is-pressed');
  window.setTimeout(() => button.classList.remove('is-pressed'), 130);
  if (button.hasAttribute('data-number')) calculator.appendNumber(button.dataset.number);
  else if (button.hasAttribute('data-operation')) calculator.chooseOperation(button.dataset.operation);
  else if (button.hasAttribute('data-all-clear')) calculator.clear();
  else if (button.hasAttribute('data-delete')) calculator.delete();
  else if (button.hasAttribute('data-equals')) calculator.compute();
  calculator.updateDisplay(button.hasAttribute('data-equals'));
}

buttons.forEach(button => button.addEventListener('click', () => pressButton(button)));

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key;
  let button;
  if (/^[0-9.]$/.test(key)) button = document.querySelector(`[data-number="${key}"]`);
  else if (['+', '-', '*', '/'].includes(key)) {
    const operation = key === '/' ? '÷' : key;
    button = [...document.querySelectorAll('[data-operation]')].find(item => item.dataset.operation === operation);
  } else if (key === 'Enter' || key === '=') button = document.querySelector('[data-equals]');
  else if (key === 'Backspace') button = document.querySelector('[data-delete]');
  else if (key === 'Escape') button = document.querySelector('[data-all-clear]');
  if (button) {
    event.preventDefault();
    pressButton(button);
  }
});

calculator.updateDisplay();
