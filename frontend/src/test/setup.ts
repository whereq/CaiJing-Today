import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// i18next is initialised once here so `useTranslation` works in every test
// file without each one importing the app's i18n entry point.
import '../i18n'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
