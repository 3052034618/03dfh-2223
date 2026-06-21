import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import type { TempStatus } from '@/types/coldchain'
import { getStatusLabel } from '@/utils/format'

interface TempStatusBadgeProps {
  status: TempStatus
  size?: 'sm' | 'md'
}

const TempStatusBadge: React.FC<TempStatusBadgeProps> = ({ status }) => {
  return (
    <View className={classnames(styles.badge, styles[status])}>
      <View className={styles.dot} />
      <Text>{getStatusLabel(status)}</Text>
    </View>
  )
}

export default TempStatusBadge
