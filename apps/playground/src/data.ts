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

// --- Products ---

export type Product = {
  id: number
  name: string
  category: string
  price: number
  rating: number
  inStock: boolean
  image: string
  sku: string
}

export const products: Product[] = [
  { id: 1, name: 'Wireless Headphones', category: 'Electronics', price: 89.99, rating: 4.5, inStock: true, image: 'https://picsum.photos/seed/headphones/40', sku: 'WH-1001' },
  { id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 149.99, rating: 4.8, inStock: true, image: 'https://picsum.photos/seed/keyboard/40', sku: 'MK-2002' },
  { id: 3, name: 'Running Shoes', category: 'Clothing', price: 129.00, rating: 4.2, inStock: true, image: 'https://picsum.photos/seed/shoes/40', sku: 'RS-3003' },
  { id: 4, name: 'Coffee Maker', category: 'Home', price: 79.50, rating: 4.0, inStock: false, image: 'https://picsum.photos/seed/coffee/40', sku: 'CM-4004' },
  { id: 5, name: 'Desk Lamp', category: 'Home', price: 45.00, rating: 3.8, inStock: true, image: 'https://picsum.photos/seed/lamp/40', sku: 'DL-5005' },
  { id: 6, name: 'Yoga Mat', category: 'Sports', price: 35.99, rating: 4.6, inStock: true, image: 'https://picsum.photos/seed/yoga/40', sku: 'YM-6006' },
  { id: 7, name: 'Backpack', category: 'Accessories', price: 69.99, rating: 4.3, inStock: true, image: 'https://picsum.photos/seed/backpack/40', sku: 'BP-7007' },
  { id: 8, name: 'Smart Watch', category: 'Electronics', price: 249.99, rating: 4.7, inStock: false, image: 'https://picsum.photos/seed/watch/40', sku: 'SW-8008' },
  { id: 9, name: 'Sunglasses', category: 'Accessories', price: 59.00, rating: 3.9, inStock: true, image: 'https://picsum.photos/seed/sunglasses/40', sku: 'SG-9009' },
  { id: 10, name: 'Water Bottle', category: 'Sports', price: 24.99, rating: 4.4, inStock: true, image: 'https://picsum.photos/seed/bottle/40', sku: 'WB-1010' },
  { id: 11, name: 'Notebook Set', category: 'Office', price: 18.50, rating: 4.1, inStock: true, image: 'https://picsum.photos/seed/notebook/40', sku: 'NS-1111' },
  { id: 12, name: 'Wireless Mouse', category: 'Electronics', price: 39.99, rating: 4.2, inStock: true, image: 'https://picsum.photos/seed/mouse/40', sku: 'WM-1212' },
]

// --- Tasks ---

export type Task = {
  id: number
  title: string
  assignee: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'todo' | 'in-progress' | 'review' | 'done'
  dueDate: string
  tags: string[]
}

export const tasks: Task[] = [
  { id: 1, title: 'Set up CI/CD pipeline', assignee: 'Alice Johnson', priority: 'high', status: 'in-progress', dueDate: '2025-02-15', tags: ['devops', 'infra'] },
  { id: 2, title: 'Design landing page', assignee: 'Bob Smith', priority: 'medium', status: 'review', dueDate: '2025-02-10', tags: ['design', 'ui'] },
  { id: 3, title: 'Fix login timeout bug', assignee: 'Carol Williams', priority: 'critical', status: 'in-progress', dueDate: '2025-02-08', tags: ['bug', 'auth'] },
  { id: 4, title: 'Write API documentation', assignee: 'David Brown', priority: 'low', status: 'todo', dueDate: '2025-03-01', tags: ['docs'] },
  { id: 5, title: 'Implement search feature', assignee: 'Eve Davis', priority: 'high', status: 'todo', dueDate: '2025-02-20', tags: ['feature', 'search'] },
  { id: 6, title: 'Database migration v2', assignee: 'Frank Miller', priority: 'critical', status: 'done', dueDate: '2025-01-30', tags: ['db', 'migration'] },
  { id: 7, title: 'Add unit tests for auth', assignee: 'Grace Wilson', priority: 'medium', status: 'in-progress', dueDate: '2025-02-18', tags: ['testing', 'auth'] },
  { id: 8, title: 'Optimize image loading', assignee: 'Henry Taylor', priority: 'medium', status: 'todo', dueDate: '2025-02-25', tags: ['perf', 'frontend'] },
  { id: 9, title: 'Update dependencies', assignee: 'Iris Anderson', priority: 'low', status: 'done', dueDate: '2025-01-25', tags: ['maintenance'] },
  { id: 10, title: 'Mobile responsive fixes', assignee: 'Jack Thomas', priority: 'high', status: 'review', dueDate: '2025-02-12', tags: ['bug', 'mobile'] },
]

// --- Generators ---

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
    salary: 70000 + Math.floor(Math.random() * 80000),
    startDate: `20${20 + (i % 4)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    status: statuses[i % statuses.length]!,
  }))
}
