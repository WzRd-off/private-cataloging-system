export const BOOK_STATUSES = [
  { value: 'unread',  label: 'Не читав',   detailClass: 'status-unread',   catalogClass: 'badge-unread' },
  { value: 'reading', label: 'Читаю',      detailClass: 'status-reading',  catalogClass: 'badge-reading' },
  { value: 'read',    label: 'Прочитано',  detailClass: 'status-read',     catalogClass: 'badge-read' },
  { value: 'lent',    label: 'В займах',   detailClass: 'status-borrowed', catalogClass: 'badge-lent' },
];

const DEFAULT_STATUS = BOOK_STATUSES[0];

export const getBookStatus = (value) =>
  BOOK_STATUSES.find((s) => s.value === value) ?? DEFAULT_STATUS;
