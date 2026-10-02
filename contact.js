const deadline = new Date('2026-10-10T23:59:00+05:30').getTime();
const countdownParts = {
  days: document.querySelector('#countdown-days'),
  hours: document.querySelector('#countdown-hours'),
  minutes: document.querySelector('#countdown-minutes'),
  seconds: document.querySelector('#countdown-seconds'),
};
const countdownStatus = document.querySelector('#countdown-status');
let countdownInterval;

function updateCountdown() {
  const remaining = Math.max(0, deadline - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };

  for (const [unit, value] of Object.entries(values)) {
    countdownParts[unit].textContent = String(value).padStart(2, '0');
  }

  if (remaining === 0) {
    countdownStatus.textContent = 'APPLICATION WINDOW CLOSED';
    if (countdownInterval) window.clearInterval(countdownInterval);
    return;
  }
}

updateCountdown();
if (deadline > Date.now()) countdownInterval = window.setInterval(updateCountdown, 1000);
