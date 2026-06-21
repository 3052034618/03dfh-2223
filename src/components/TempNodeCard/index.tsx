import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import TempStatusBadge from '@/components/TempStatusBadge'
import type { TempNode, AbnormalReview } from '@/types/coldchain'
import { formatDateTime, formatDuration, formatTemp, getProductAppearanceLabel, getProductAppearanceColor } from '@/utils/format'

interface TempNodeCardProps {
  node: TempNode
  showReview?: boolean
  abnormalReviews?: AbnormalReview[]
  onReviewSegment?: (segmentId: string) => void
}

const TempNodeCard: React.FC<TempNodeCardProps> = ({
  node,
  showReview = false,
  abnormalReviews = [],
  onReviewSegment
}) => {
  const [expanded, setExpanded] = useState(false)

  const getReview = (segmentId: string) => {
    return abnormalReviews.find(r => r.segmentId === segmentId)
  }

  const handleToggle = () => {
    setExpanded(!expanded)
  }

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <Text className={styles.nodeTitle}>{node.label}</Text>
        <TempStatusBadge status={node.status} />
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.metaLabel}>时间段</Text>
        <Text className={styles.metaValue}>
          {formatDateTime(node.startTime, 'HH:mm')} - {formatDateTime(node.endTime, 'HH:mm')}
        </Text>
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.metaLabel}>平均温度</Text>
        <Text className={`${styles.metaValue} ${styles.tempHighlight}`}>
          {formatTemp(node.avgTemp)}
        </Text>
      </View>

      <View className={styles.metaRow}>
        <Text className={styles.metaLabel}>温度范围</Text>
        <Text className={styles.metaValue}>
          {formatTemp(node.tempRange[0])} ~ {formatTemp(node.tempRange[1])}
        </Text>
      </View>

      {node.abnormalCount > 0 && (
        <View className={styles.metaRow}>
          <Text className={styles.metaLabel}>异常次数</Text>
          <Text className={styles.metaValue} style={{ color: '#F53F3F' }}>
            {node.abnormalCount} 次
          </Text>
        </View>
      )}

      {node.abnormalCount > 0 && (
        <View className={styles.abnormalSection}>
          <Text className={styles.abnormalTitle}>
            异常片段详情
          </Text>

          {!expanded && node.abnormalSegments.slice(0, 1).map(seg => {
            const review = getReview(seg.id)
            return (
              <View key={seg.id} className={styles.abnormalItem}>
                <Text className={styles.abnormalTime}>
                  {formatDateTime(seg.startTime, 'HH:mm')} - {formatDateTime(seg.endTime, 'HH:mm')}
                </Text>
                <Text className={styles.abnormalDuration}>
                  持续 {formatDuration(seg.durationMinutes)}
                </Text>
                <Text className={styles.abnormalTemps}>
                  最高 {formatTemp(seg.maxTemp)} / 最低 {formatTemp(seg.minTemp)} / 平均 {formatTemp(seg.avgTemp)}
                </Text>
                <Text className={styles.abnormalRemark}>
                  承运方备注：{seg.carrierRemark}
                </Text>
                {showReview && (
                  <View className={styles.reviewRow}>
                    {review ? (
                      <View
                        className={styles.reviewedBadge}
                        style={{
                          background: `${getProductAppearanceColor(review.appearance)}15`,
                          color: getProductAppearanceColor(review.appearance)
                        }}
                        onClick={() => onReviewSegment?.(seg.id)}>
                        ✓ {getProductAppearanceLabel(review.appearance)}
                      </View>
                    ) : (
                      <View
                        className={styles.reviewBtn}
                        onClick={() => onReviewSegment?.(seg.id)}>
                        立即复核 →
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          })}

          {expanded && node.abnormalSegments.map(seg => {
            const review = getReview(seg.id)
            return (
              <View key={seg.id} className={styles.abnormalItem}>
                <Text className={styles.abnormalTime}>
                  {formatDateTime(seg.startTime, 'HH:mm')} - {formatDateTime(seg.endTime, 'HH:mm')}
                </Text>
                <Text className={styles.abnormalDuration}>
                  持续 {formatDuration(seg.durationMinutes)}
                </Text>
                <Text className={styles.abnormalTemps}>
                  最高 {formatTemp(seg.maxTemp)} / 最低 {formatTemp(seg.minTemp)} / 平均 {formatTemp(seg.avgTemp)}
                </Text>
                <Text className={styles.abnormalRemark}>
                  承运方备注：{seg.carrierRemark}
                </Text>
                {showReview && (
                  <View className={styles.reviewRow}>
                    {review ? (
                      <View
                        className={styles.reviewedBadge}
                        style={{
                          background: `${getProductAppearanceColor(review.appearance)}15`,
                          color: getProductAppearanceColor(review.appearance)
                        }}
                        onClick={() => onReviewSegment?.(seg.id)}>
                        ✓ {getProductAppearanceLabel(review.appearance)}
                      </View>
                    ) : (
                      <View
                        className={styles.reviewBtn}
                        onClick={() => onReviewSegment?.(seg.id)}>
                        立即复核 →
                      </View>
                    )}
                  </View>
                )}
              </View>
            )
          })}

          {node.abnormalSegments.length > 1 && (
            <View className={styles.expandBtn} onClick={handleToggle}>
              {expanded ? '收起' : `展开全部 ${node.abnormalSegments.length} 条异常`}
            </View>
          )}
        </View>
      )}

      {node.abnormalCount === 0 && (
        <View className={styles.emptyText}>
          本阶段温度正常，无异常记录
        </View>
      )}
    </View>
  )
}

export default TempNodeCard
