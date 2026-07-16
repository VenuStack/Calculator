/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Simple Calculator - Core Logic (Vanilla JavaScript)
 * This script manages the state of the calculator, handles user input via mouse click
 * and physical keyboard, validates operations dynamically, and renders values safely.
 */

// --- DOM ELEMENT REFERENCES ---
const displayHistory = document.getElementById('display-history');
const displayCurrent = document.getElementById('display-current');
const keypad = document.getElementById('calculator-keypad');

// --- STATE VARIABLES ---
// currentExpression stores the string representing the mathematical equation (e.g., "12+5*3")
let currentExpression = '0';
// previousExpression stores the last calculated equation and its result
let previousExpression = '';
// shouldResetScreen is flagged true after pressing '=' so that typing a new number clears the previous result
let shouldResetScreen = false;

// List of standard mathematical operators
const operators = ['+', '-', '*', '/'];

// --- CORE UTILITY FUNCTIONS ---

/**
 * Updates the screen element displays with the current memory values.
 * Translates * to × and / to ÷ for a elegant, readable user layout.
 */
function updateDisplay() {
  // Format the expressions for human readability
  const formattedCurrent = currentExpression
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/\-/g, ' - ');

  const formattedHistory = previousExpression
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/\-/g, ' - ');

  displayCurrent.textContent = formattedCurrent;
  displayHistory.textContent = formattedHistory;

  // Scroll display-current to the right if it overflows, ensuring the latest digits are visible
  displayCurrent.scrollLeft = displayCurrent.scrollWidth;
}

/**
 * Resets the entire calculator state (All Clear - AC).
 */
function allClear() {
  currentExpression = '0';
  previousExpression = '';
  shouldResetScreen = false;
  updateDisplay();
}

/**
 * Clears only the current display input line, keeping history (Clear - C).
 */
function clearCurrent() {
  currentExpression = '0';
  updateDisplay();
}

/**
 * Deletes the last entered character from the current input (Backspace).
 */
function handleBackspace() {
  // If screen shows Error, clear completely
  if (currentExpression === 'Error') {
    allClear();
    return;
  }

  // If there is only one character, reset to "0"
  if (currentExpression.length <= 1) {
    currentExpression = '0';
  } else {
    currentExpression = currentExpression.slice(0, -1);
  }
  updateDisplay();
}

/**
 * Validates if a decimal point can be appended to the current number token.
 * Prevents entries like "12.5.3".
 */
function canAppendDecimal() {
  // Split expression by operator characters to isolate the last active number token
  const tokens = currentExpression.split(/[\+\-\*\/]/);
  const currentToken = tokens[tokens.length - 1];
  
  // If the last token doesn't have a decimal yet, it is valid to add one
  return !currentToken.includes('.');
}

/**
 * Appends a digit (0-9) to the equation string.
 * @param {string} digit 
 */
function appendDigit(digit) {
  // If we just clicked "=", start a new expression unless they clicked an operator
  if (shouldResetScreen || currentExpression === 'Error') {
    currentExpression = digit;
    shouldResetScreen = false;
  } else {
    // Prevent multiple leading zeros (e.g., "0005" stays "5")
    if (currentExpression === '0') {
      currentExpression = digit;
    } else {
      currentExpression += digit;
    }
  }
  updateDisplay();
}

/**
 * Appends a decimal point (.) safely.
 */
function appendDecimal() {
  if (shouldResetScreen || currentExpression === 'Error') {
    currentExpression = '0.';
    shouldResetScreen = false;
  } else {
    if (canAppendDecimal()) {
      currentExpression += '.';
    }
  }
  updateDisplay();
}

/**
 * Appends or updates a mathematical operator (+, -, *, /) in the equation.
 * @param {string} operator 
 */
function appendOperator(operator) {
  // If screen displays Error, reset to 0 first
  if (currentExpression === 'Error') {
    currentExpression = '0';
  }

  // If a result is currently active, clicking an operator uses that result as base
  if (shouldResetScreen) {
    shouldResetScreen = false;
  }

  const lastChar = currentExpression.slice(-1);

  // If the last character is already an operator, replace it with the newly clicked operator
  if (operators.includes(lastChar)) {
    currentExpression = currentExpression.slice(0, -1) + operator;
  } else {
    currentExpression += operator;
  }
  updateDisplay();
}

/**
 * Evaluates the current mathematical expression safely and displays the result.
 */
function calculateResult() {
  if (currentExpression === 'Error') return;

  let expressionToEvaluate = currentExpression;

  // Trim any trailing operator if the expression was left incomplete (e.g., "5 + 3 +" becomes "5 + 3")
  const lastChar = expressionToEvaluate.slice(-1);
  if (operators.includes(lastChar)) {
    expressionToEvaluate = expressionToEvaluate.slice(0, -1);
  }

  // Sanitization check: Ensure the expression consists exclusively of valid math characters
  const sanitizedExpression = expressionToEvaluate.replace(/[^0-9\+\-\*\/\.]/g, '');

  if (!sanitizedExpression) {
    currentExpression = '0';
    updateDisplay();
    return;
  }

  try {
    // Evaluate safely using the Function constructor instead of direct eval()
    const result = new Function(`return ${sanitizedExpression}`)();

    if (result === undefined || isNaN(result)) {
      throw new Error('Invalid calculation');
    }

    // Handle Division by Zero
    if (!isFinite(result)) {
      currentExpression = 'Error';
      previousExpression = `${expressionToEvaluate} =`;
      shouldResetScreen = true;
      updateDisplay();
      return;
    }

    // Eliminate float precision issues (e.g. 0.1 + 0.2) by rounding to 10 decimal points
    const formattedResult = parseFloat(result.toFixed(10)).toString();

    // Store history state
    previousExpression = `${expressionToEvaluate} =`;
    currentExpression = formattedResult;
    shouldResetScreen = true;
  } catch (error) {
    currentExpression = 'Error';
    previousExpression = '';
  }

  updateDisplay();
}


// --- EVENT HANDLERS ---

/**
 * Directs button clicks to their corresponding operations.
 * @param {Event} event 
 */
function handleButtonClick(event) {
  const target = event.target;
  
  // Exit if we didn't click an actual button inside the keypad
  if (!target.classList.contains('btn')) return;

  const digit = target.getAttribute('data-number');
  const operator = target.getAttribute('data-operator');
  const action = target.getAttribute('data-action');
  const decimal = target.getAttribute('data-decimal');

  // Trigger click animation feedback
  animateButtonPress(target);

  if (digit !== null) {
    appendDigit(digit);
  } else if (operator !== null) {
    appendOperator(operator);
  } else if (decimal !== null) {
    appendDecimal();
  } else if (action !== null) {
    switch (action) {
      case 'all-clear':
        allClear();
        break;
      case 'clear':
        clearCurrent();
        break;
      case 'backspace':
        handleBackspace();
        break;
      case 'calculate':
        calculateResult();
        break;
    }
  }
}

/**
 * Triggers a visual press effect on physical button components
 * @param {HTMLElement} btnElement 
 */
function animateButtonPress(btnElement) {
  btnElement.classList.add('keyboard-active');
  setTimeout(() => {
    btnElement.classList.remove('keyboard-active');
  }, 100);
}


// --- KEYBOARD INTEGRATION ---

/**
 * Handles physical keyboard events and maps them to the appropriate calculator actions.
 * @param {KeyboardEvent} event 
 */
function handleKeyboard(event) {
  const key = event.key;
  let targetBtnId = null;

  if (/[0-9]/.test(key)) {
    // Digits 0-9
    appendDigit(key);
    targetBtnId = `btn-${key}`;
  } else if (key === '.') {
    appendDecimal();
    targetBtnId = 'btn-decimal';
  } else if (key === '+') {
    appendOperator('+');
    targetBtnId = 'btn-add';
  } else if (key === '-') {
    appendOperator('-');
    targetBtnId = 'btn-subtract';
  } else if (key === '*') {
    appendOperator('*');
    targetBtnId = 'btn-multiply';
  } else if (key === '/') {
    // Prevent default browser search popups when '/' is pressed
    event.preventDefault();
    appendOperator('/');
    targetBtnId = 'btn-divide';
  } else if (key === 'Enter' || key === '=') {
    calculateResult();
    targetBtnId = 'btn-equals';
  } else if (key === 'Backspace') {
    handleBackspace();
    targetBtnId = 'btn-backspace';
  } else if (key === 'Escape') {
    allClear();
    targetBtnId = 'btn-ac';
  } else if (key === 'c' || key === 'C') {
    clearCurrent();
    targetBtnId = 'btn-c';
  }

  // Trigger active state animation on corresponding DOM element if found
  if (targetBtnId) {
    const btnElement = document.getElementById(targetBtnId);
    if (btnElement) {
      animateButtonPress(btnElement);
    }
  }
}


// --- INITIALIZATION ---

// Add listener to the keypad container utilizing event delegation
keypad.addEventListener('click', handleButtonClick);

// Add global listener to the document for physical keyboard entries
document.addEventListener('keydown', handleKeyboard);

// Render initial empty state values
updateDisplay();
