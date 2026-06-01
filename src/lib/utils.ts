export function getChecklistProgress(notes: string | undefined | null) {
  if (!notes) return null;
  const lines = notes.split('\n');
  let total = 0;
  let completed = 0;
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
      total++;
      if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
        completed++;
      }
    }
  });
  return total > 0 ? { completed, total } : null;
}

export function getDueDateStatus(dueDate: string | undefined | null) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  // Strip hours
  due.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', text: 'Overdue', days: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { status: 'today', text: 'Due Today', days: 0 };
  } else if (diffDays === 1) {
    return { status: 'tomorrow', text: 'Due Tomorrow', days: 1 };
  } else {
    return { status: 'incoming', text: `Due in ${diffDays} days`, days: diffDays };
  }
}
