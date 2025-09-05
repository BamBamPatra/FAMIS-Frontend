// Centralized test data for Admin Dashboard – edit these values to match your prepared record

export const TEST_USERS_INITIAL = [
  { id: 1001, email: 'admin_01@cmu.ac.th', role: 'admin', department: 'Financial Department' },
  { id: 1002, email: 'user_02@cmu.ac.th', role: 'staff', department: 'Faculty of Engineering' },
]

export const TEST_ASSIGN = {
  email: 'new_user@cmu.ac.th',
  role: 'staff' as const,
  department: 'Faculty of Engineering',
}

export const TEST_CHANGE = {
  userId: 1002,
  newRole: 'admin' as const,
}

export const TEST_DELETE = {
  userId: 1002,
}


