import { Component, type ReactNode } from 'react'
import { Alert } from 'antd'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Alert
          type="error"
          message="Something went wrong"
          description={this.state.error?.message || 'An unexpected error occurred.'}
          showIcon
          className="rounded-xl"
        />
      )
    }
    return this.props.children
  }
}
