export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return new Date() > new Date(dueDate);
};

export const getPriorityColor = (priority) => {
  const colors = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
  return colors[priority] || '#94a3b8';
};

export const getStatusLabel = (status) => {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return labels[status] || status;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const daysUntil = (date) => {
  if (!date) return null;
  return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
};
