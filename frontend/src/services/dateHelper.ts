import { toEthiopian } from 'ethiopian-date';

const ethiopianMonthsAmharic = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሳስ',
  'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ',
  'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'
];

export function formatEthiopianDateTimeAmharic(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return 'ቀን የለም';
  let date: Date;
  if (typeof dateInput === 'string') {
    if (!dateInput.trim() || dateInput === 'Invalid date') return 'ቀን የለም';
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'ቀን የለም';

  try {
    const { year, month, day } = toEthiopian(date);
    const monthName = ethiopianMonthsAmharic[month - 1] || '';
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${monthName} ${day}, ${year} ${hours}:${minutesStr} ${ampm}`;
  } catch (e) {
    return 'ቀን የለም';
  }
} 