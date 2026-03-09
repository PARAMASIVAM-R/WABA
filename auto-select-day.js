const fs = require('fs');

const filePath = 'E:\\WABA\\frontend\\src\\pages\\Dashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /setCalendarSlotForm\(\{ \.\.\.calendarSlotForm, date: dateStr \}\)/g,
  'setCalendarSlotForm({ ...calendarSlotForm, date: dateStr, selectedDays: [date.getDay()] })'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Auto-select current day added!');
