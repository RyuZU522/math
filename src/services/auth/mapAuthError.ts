/** 将 Supabase / 网络错误转为中文提示 */
export const mapAuthErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const rawMessage = error instanceof Error ? error.message : String(error)
  const normalizedMessage = rawMessage.toLowerCase()

  if (
    normalizedMessage.includes('email not confirmed')
    || normalizedMessage.includes('email_not_confirmed')
  ) {
    return '邮箱尚未确认。请先打开注册邮件完成验证，或在 Supabase 后台关闭“Confirm email”。'
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return '邮箱或密码错误'
  }

  if (normalizedMessage.includes('user already registered')) {
    return '该邮箱已注册，请直接登录'
  }

  if (normalizedMessage.includes('password')) {
    return '密码不符合要求，请使用至少 6 位密码'
  }

  return rawMessage || fallbackMessage
}
