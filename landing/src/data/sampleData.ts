export type Employee = {
  id: number
  name: string
  email: string
  department: string
  role: string
  salary: number
  startDate: string
  status: 'active' | 'inactive' | 'on-leave'
}

export const employees: Employee[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', department: 'Engineering', role: 'Senior Engineer', salary: 135000, startDate: '2021-03-15', status: 'active' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', department: 'Design', role: 'Lead Designer', salary: 120000, startDate: '2020-07-01', status: 'active' },
  { id: 3, name: 'Carol Williams', email: 'carol@example.com', department: 'Engineering', role: 'Staff Engineer', salary: 155000, startDate: '2019-01-10', status: 'active' },
  { id: 4, name: 'David Brown', email: 'david@example.com', department: 'Marketing', role: 'Marketing Manager', salary: 110000, startDate: '2022-05-20', status: 'on-leave' },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', department: 'Engineering', role: 'Junior Engineer', salary: 95000, startDate: '2023-09-01', status: 'active' },
  { id: 6, name: 'Frank Miller', email: 'frank@example.com', department: 'Sales', role: 'Account Executive', salary: 105000, startDate: '2021-11-12', status: 'active' },
  { id: 7, name: 'Grace Wilson', email: 'grace@example.com', department: 'Engineering', role: 'DevOps Engineer', salary: 130000, startDate: '2020-02-28', status: 'inactive' },
  { id: 8, name: 'Henry Taylor', email: 'henry@example.com', department: 'Design', role: 'UX Researcher', salary: 100000, startDate: '2022-08-15', status: 'active' },
  { id: 9, name: 'Iris Anderson', email: 'iris@example.com', department: 'Marketing', role: 'Content Strategist', salary: 90000, startDate: '2023-01-05', status: 'active' },
  { id: 10, name: 'Jack Thomas', email: 'jack@example.com', department: 'Engineering', role: 'Frontend Engineer', salary: 125000, startDate: '2021-06-30', status: 'active' },
  { id: 11, name: 'Karen Jackson', email: 'karen@example.com', department: 'Sales', role: 'Sales Director', salary: 145000, startDate: '2018-04-22', status: 'active' },
  { id: 12, name: 'Leo White', email: 'leo@example.com', department: 'Engineering', role: 'Backend Engineer', salary: 128000, startDate: '2020-10-17', status: 'active' },
  { id: 13, name: 'Mia Harris', email: 'mia@example.com', department: 'Design', role: 'Product Designer', salary: 115000, startDate: '2022-03-08', status: 'on-leave' },
  { id: 14, name: 'Noah Martin', email: 'noah@example.com', department: 'Marketing', role: 'SEO Specialist', salary: 85000, startDate: '2023-06-14', status: 'active' },
  { id: 15, name: 'Olivia Garcia', email: 'olivia@example.com', department: 'Engineering', role: 'QA Engineer', salary: 108000, startDate: '2021-09-25', status: 'active' },
]

export function generateLargeDataset(count: number): Employee[] {
  const departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance']
  const roles = ['Engineer', 'Designer', 'Manager', 'Analyst', 'Coordinator', 'Director']
  const statuses: Employee['status'][] = ['active', 'inactive', 'on-leave']
  const firstNames = ['Alex', 'Blake', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jordan']
  const lastNames = ['Adams', 'Baker', 'Clark', 'Dixon', 'Evans', 'Foster', 'Grant', 'Hayes', 'Irwin', 'Jones']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
    email: `user${i + 1}@example.com`,
    department: departments[i % departments.length]!,
    role: roles[i % roles.length]!,
    salary: 70000 + ((i * 3137) % 80000),
    startDate: `20${20 + (i % 4)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    status: statuses[i % statuses.length]!,
  }))
}
