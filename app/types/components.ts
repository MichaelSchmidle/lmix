/**
 * Standardized component prop and emit types
 */

/**
 * Common props for CRUD components
 */
export interface CrudComponentProps<T> {
  item?: T
  loading?: boolean
}

/**
 * Common emits for CRUD components
 */
export interface CrudComponentEmits<T> {
  success: [item: T]
  error: [error: Error]
  cancel: []
}

/**
 * Props for delete confirmation components
 */
export interface DeleteComponentProps<T> {
  item: T
  itemName: string
}

/**
 * Props for upsert (create/update) components
 */
export interface UpsertComponentProps<T> {
  item?: T
  loading?: boolean
}

/**
 * Common form state interface
 */
export interface FormState {
  busy: boolean
  error: string | null
}