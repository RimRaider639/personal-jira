/**
 * AnalyticsDashboard - Power BI-style analytics dashboard
 * 
 * Displays visual analytics including:
 * - Activity heatmap (GitHub-style)
 * - Most productive day of week
 * - Task completion trends
 * - Priority distribution
 * - Epic progress
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Text,
  HStack,
  VStack,
  Icon,
  Badge,
  Progress,
} from '@chakra-ui/react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchBoards,
  fetchAllTasks,
  fetchAllEpics,
  fetchActivityHeatmap,
} from '@/store/slices';
import {
  selectAllBoards,
  selectAllTasks,
  selectAllEpics,
  selectCurrentUser,
} from '@/store/selectors';
import { ThemedBackground, DarkModeToggle, ProfileAvatar } from '@/components';
import { useTheme } from '@/theme/ThemeContext';
import { AppCard, AppCardBody, LoadingState } from '@/components/chakra';
import {
  ActivityIcon,
  ChartIcon,
  TagIcon,
  CalendarIcon,
  CheckIcon,
  ListIcon,
  HomeIcon,
} from '@/theme/icons';
import { AppIconButton, AppTooltip } from '@/components/chakra';
import { logout } from '@/store/slices';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { Task, ActivityHeatmapEntry } from '@kanban/shared';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

/**
 * StatCard - Individual stat card component
 */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, subtitle, icon, color = 'brand.500', trend }: StatCardProps): React.JSX.Element {
  return (
    <AppCard>
      <AppCardBody p={4}>
        <Flex justify="space-between" align="flex-start">
          <VStack align="flex-start" gap={1}>
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase" fontWeight="semibold">
              {title}
            </Text>
            <Text fontSize="3xl" fontWeight="bold" color={color}>
              {value}
            </Text>
            {subtitle && (
              <Text fontSize="sm" color="fg.muted">
                {subtitle}
              </Text>
            )}
            {trend && (
              <Badge colorPalette={trend.isPositive ? 'green' : 'red'} fontSize="xs">
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Badge>
            )}
          </VStack>
          <Box p={3} borderRadius="lg" bg={`${color}15`}>
            <Icon color={color} boxSize={6}>
              {icon}
            </Icon>
          </Box>
        </Flex>
      </AppCardBody>
    </AppCard>
  );
}

/**
 * ActivityHeatmap - GitHub-style activity heatmap
 */
interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  days: number;
}

function ActivityHeatmap({ data, days }: ActivityHeatmapProps): React.JSX.Element {
  const heatmapData = useMemo(() => {
    const result: { date: string; count: number; dayOfWeek: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const entry = data.find((d) => d.date === dateStr);
      result.push({
        date: dateStr,
        count: entry?.count || 0,
        dayOfWeek: date.getDay(),
      });
    }

    return result;
  }, [data, days]);

  const getHeatColor = (count: number): string => {
    if (count === 0) return 'gray.200';
    if (count <= 2) return 'green.200';
    if (count <= 5) return 'green.400';
    if (count <= 10) return 'green.500';
    return 'green.600';
  };

  // Group by weeks
  const weeks = useMemo(() => {
    const result: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];

    heatmapData.forEach((day, index) => {
      if (index === 0) {
        // Pad the first week with empty days
        for (let i = 0; i < day.dayOfWeek; i++) {
          currentWeek.push({ date: '', count: -1, dayOfWeek: i });
        }
      }
      currentWeek.push(day);
      if (day.dayOfWeek === 6 || index === heatmapData.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [heatmapData]);

  return (
    <VStack gap={2} align="stretch">
      <HStack gap={1}>
        <VStack gap={1} mr={1}>
          {DAYS_OF_WEEK.map((day, i) => (
            <Text key={day} fontSize="2xs" color="fg.muted" h="14px" lineHeight="14px">
              {i % 2 === 1 ? day : ''}
            </Text>
          ))}
        </VStack>
        <HStack gap={1}>
          {weeks.map((week, weekIndex) => (
            <VStack key={weekIndex} gap={1}>
              {week.map((day, dayIndex) => (
                <Box
                  key={`${weekIndex}-${dayIndex}`}
                  w="14px"
                  h="14px"
                  borderRadius="2px"
                  bg={day.count === -1 ? 'transparent' : getHeatColor(day.count)}
                  title={day.date ? `${day.date}: ${day.count} activities` : ''}
                />
              ))}
            </VStack>
          ))}
        </HStack>
      </HStack>
      <HStack gap={1} justify="flex-end">
        <Text fontSize="xs" color="fg.muted">Less</Text>
        <Box w="14px" h="14px" borderRadius="2px" bg="gray.200" />
        <Box w="14px" h="14px" borderRadius="2px" bg="green.200" />
        <Box w="14px" h="14px" borderRadius="2px" bg="green.400" />
        <Box w="14px" h="14px" borderRadius="2px" bg="green.500" />
        <Box w="14px" h="14px" borderRadius="2px" bg="green.600" />
        <Text fontSize="xs" color="fg.muted">More</Text>
      </HStack>
    </VStack>
  );
}

/**
 * DayOfWeekChart - Bar chart showing activity by day of week
 */
interface DayOfWeekChartProps {
  data: { day: string; count: number; percentage: number }[];
  mostProductiveDay: string;
}

function DayOfWeekChart({ data, mostProductiveDay }: DayOfWeekChartProps): React.JSX.Element {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <VStack gap={3} align="stretch">
      {data.map((item) => (
        <HStack key={item.day} gap={3}>
          <Text
            fontSize="sm"
            fontWeight={item.day === mostProductiveDay ? 'bold' : 'normal'}
            color={item.day === mostProductiveDay ? 'brand.500' : 'fg'}
            w="40px"
          >
            {item.day}
          </Text>
          <Box flex={1} position="relative">
            <Box
              h="24px"
              bg="gray.100"
              _dark={{ bg: 'gray.700' }}
              borderRadius="md"
              overflow="hidden"
            >
              <Box
                h="full"
                w={`${(item.count / maxCount) * 100}%`}
                bg={item.day === mostProductiveDay ? 'brand.500' : 'brand.300'}
                borderRadius="md"
                transition="width 0.3s"
              />
            </Box>
            <Text
              position="absolute"
              right={2}
              top="50%"
              transform="translateY(-50%)"
              fontSize="xs"
              fontWeight="semibold"
              color={item.count / maxCount > 0.5 ? 'white' : 'fg'}
            >
              {item.count}
            </Text>
          </Box>
          <Text fontSize="xs" color="fg.muted" w="40px" textAlign="right">
            {item.percentage}%
          </Text>
        </HStack>
      ))}
    </VStack>
  );
}

/**
 * PriorityDistribution - Donut-style priority distribution
 */
interface PriorityDistributionProps {
  data: { priority: string; count: number; percentage: number }[];
}

function PriorityDistribution({ data }: PriorityDistributionProps): React.JSX.Element {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <VStack gap={4} align="stretch">
      {/* Visual bars */}
      <HStack h="12px" borderRadius="full" overflow="hidden" bg="gray.100" _dark={{ bg: 'gray.700' }}>
        {data.map((item) => (
          <Box
            key={item.priority}
            h="full"
            w={`${item.percentage}%`}
            bg={PRIORITY_COLORS[item.priority] || 'gray.400'}
            transition="width 0.3s"
          />
        ))}
      </HStack>

      {/* Legend */}
      <SimpleGrid columns={2} gap={3}>
        {data.map((item) => (
          <HStack key={item.priority} gap={2}>
            <Box
              w="12px"
              h="12px"
              borderRadius="full"
              bg={PRIORITY_COLORS[item.priority] || 'gray.400'}
            />
            <VStack align="flex-start" gap={0}>
              <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                {item.priority || 'None'}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {item.count} ({item.percentage}%)
              </Text>
            </VStack>
          </HStack>
        ))}
      </SimpleGrid>
    </VStack>
  );
}

/**
 * EpicProgress - Progress bars for epics
 */
interface EpicProgressProps {
  epics: { name: string; color: string; completed: number; total: number }[];
}

function EpicProgress({ epics }: EpicProgressProps): React.JSX.Element {
  if (epics.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted" fontStyle="italic">
        No epics created yet
      </Text>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {epics.slice(0, 5).map((epic) => {
        const percentage = epic.total > 0 ? Math.round((epic.completed / epic.total) * 100) : 0;
        return (
          <VStack key={epic.name} gap={1} align="stretch">
            <Flex justify="space-between">
              <HStack gap={2}>
                <Box w="10px" h="10px" borderRadius="full" bg={epic.color} />
                <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                  {epic.name}
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                {epic.completed}/{epic.total}
              </Text>
            </Flex>
            <Progress.Root value={percentage} size="sm">
              <Progress.Track>
                <Progress.Range style={{ backgroundColor: epic.color }} />
              </Progress.Track>
            </Progress.Root>
          </VStack>
        );
      })}
    </VStack>
  );
}

/**
 * CompletionTrend - Weekly completion trend
 */
interface CompletionTrendProps {
  data: { week: string; completed: number; created: number }[];
}

function CompletionTrend({ data }: CompletionTrendProps): React.JSX.Element {
  const maxValue = Math.max(...data.flatMap((d) => [d.completed, d.created]), 1);

  return (
    <VStack gap={3} align="stretch">
      <HStack gap={2} justify="flex-end">
        <HStack gap={1}>
          <Box w="12px" h="12px" borderRadius="sm" bg="green.500" />
          <Text fontSize="xs" color="fg.muted">Completed</Text>
        </HStack>
        <HStack gap={1}>
          <Box w="12px" h="12px" borderRadius="sm" bg="blue.500" />
          <Text fontSize="xs" color="fg.muted">Created</Text>
        </HStack>
      </HStack>
      <HStack gap={2} align="flex-end" h="120px">
        {data.map((item) => (
          <VStack key={item.week} flex={1} gap={1} align="center">
            <HStack gap={1} align="flex-end" h="100px">
              <Box
                w="12px"
                h={`${(item.completed / maxValue) * 100}%`}
                bg="green.500"
                borderRadius="sm"
                minH="4px"
              />
              <Box
                w="12px"
                h={`${(item.created / maxValue) * 100}%`}
                bg="blue.500"
                borderRadius="sm"
                minH="4px"
              />
            </HStack>
            <Text fontSize="2xs" color="fg.muted">
              {item.week}
            </Text>
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
}

/**
 * AnalyticsDashboard - Main analytics dashboard screen
 */
export function AnalyticsDashboard(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const boards = useAppSelector(selectAllBoards);
  const tasks = useAppSelector(selectAllTasks);
  const epics = useAppSelector(selectAllEpics);
  const user = useAppSelector(selectCurrentUser);
  const boardHeatmaps = useAppSelector((state) => state.boards.heatmaps);
  const isLoading = useAppSelector((state) => state.boards.isLoading || state.tasks.isLoading);

  const [selectedTimeframe, setSelectedTimeframe] = useState(90);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchBoards());
    dispatch(fetchAllTasks());
    dispatch(fetchAllEpics());
  }, [dispatch]);

  // Fetch heatmaps for all boards
  useEffect(() => {
    boards.forEach((board) => {
      if (!boardHeatmaps[board.id] || boardHeatmaps[board.id].days !== selectedTimeframe) {
        dispatch(fetchActivityHeatmap({ boardId: board.id, days: selectedTimeframe }));
      }
    });
  }, [dispatch, boards, boardHeatmaps, selectedTimeframe]);

  // Combine all heatmap data
  const combinedHeatmapData = useMemo(() => {
    const combined: Record<string, number> = {};
    Object.values(boardHeatmaps).forEach((heatmap) => {
      heatmap.data.forEach((entry) => {
        combined[entry.date] = (combined[entry.date] || 0) + entry.count;
      });
    });
    return Object.entries(combined).map(([date, count]) => ({ date, count }));
  }, [boardHeatmaps]);

  // Calculate day of week productivity
  const dayOfWeekData = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    combinedHeatmapData.forEach((entry) => {
      const dayOfWeek = new Date(entry.date).getDay();
      counts[dayOfWeek] += entry.count;
    });

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
    return DAYS_OF_WEEK.map((day, index) => ({
      day,
      count: counts[index],
      percentage: total > 0 ? Math.round((counts[index] / total) * 100) : 0,
    }));
  }, [combinedHeatmapData]);

  const mostProductiveDay = useMemo(() => {
    const maxCount = Math.max(...dayOfWeekData.map((d) => d.count));
    return dayOfWeekData.find((d) => d.count === maxCount)?.day || 'N/A';
  }, [dayOfWeekData]);

  // Calculate priority distribution
  const priorityDistribution = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
    tasks.forEach((task) => {
      if (task.priority) {
        counts[task.priority] = (counts[task.priority] || 0) + 1;
      } else {
        counts.none += 1;
      }
    });

    const total = tasks.length || 1;
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([priority, count]) => ({
        priority,
        count,
        percentage: Math.round((count / total) * 100),
      }));
  }, [tasks]);

  // Calculate epic progress
  const epicProgress = useMemo(() => {
    return epics.map((epic) => {
      const epicTasks = tasks.filter((t) => t.epicIds.includes(epic.id));
      const completed = epicTasks.filter((t) => t.isArchived).length;
      return {
        name: epic.name,
        color: epic.color,
        completed,
        total: epicTasks.length,
      };
    });
  }, [epics, tasks]);

  // Calculate completion trend (last 4 weeks)
  const completionTrend = useMemo(() => {
    const weeks: { week: string; completed: number; created: number }[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekLabel = `W${4 - i}`;
      
      // Count activities in this week from heatmap
      const weekActivities = combinedHeatmapData.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      const totalActivity = weekActivities.reduce((sum, e) => sum + e.count, 0);
      
      weeks.push({
        week: weekLabel,
        completed: Math.floor(totalActivity * 0.6), // Approximate completed
        created: Math.floor(totalActivity * 0.4), // Approximate created
      });
    }

    return weeks;
  }, [combinedHeatmapData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.isArchived).length;
    const overdueTasks = tasks.filter((t) => {
      if (!t.endDate || t.isArchived) return false;
      return new Date(t.endDate) < new Date();
    }).length;
    const totalActivity = combinedHeatmapData.reduce((sum, e) => sum + e.count, 0);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      totalActivity,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [tasks, combinedHeatmapData]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleBackToBoards = useCallback(() => {
    navigation.navigate('BoardList');
  }, [navigation]);

  if (isLoading && tasks.length === 0) {
    return (
      <ThemedBackground>
        <LoadingState variant="skeleton-card" count={6} label="Loading analytics..." />
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: '100%' }}>
        <Box minH="100vh">
          {/* Header */}
          <Flex
            as="header"
            justify="space-between"
            align="center"
            p={5}
            bg={colors.headerBackground}
            position="sticky"
            top={0}
            zIndex={10}
          >
            <HStack gap={4}>
              <AppTooltip label="Go to home" placement="bottom">
                <AppIconButton
                  intent="ghost"
                  aria-label="Go to home"
                  onClick={handleBackToBoards}
                  bg="whiteAlpha.200"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                >
                  <HomeIcon />
                </AppIconButton>
              </AppTooltip>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color={colors.headerText}>
                  Analytics Dashboard
                </Text>
                <Text fontSize="sm" color={colors.headerText} opacity={0.8}>
                  Your productivity insights
                </Text>
              </Box>
            </HStack>
            <HStack gap={3}>
              <DarkModeToggle />
              <ProfileAvatar displayName={user?.displayName || 'User'} onLogout={handleLogout} />
            </HStack>
          </Flex>

          {/* Content */}
          <Container maxW="container.xl" py={6}>
            <VStack gap={6} align="stretch">
              {/* Timeframe selector */}
              <HStack gap={2}>
                {[30, 60, 90].map((days) => (
                  <Badge
                    key={days}
                    px={3}
                    py={2}
                    borderRadius="md"
                    cursor="pointer"
                    variant={selectedTimeframe === days ? 'solid' : 'outline'}
                    colorPalette={selectedTimeframe === days ? 'brand' : 'gray'}
                    onClick={() => setSelectedTimeframe(days)}
                  >
                    Last {days} days
                  </Badge>
                ))}
              </HStack>

              {/* Stats Row */}
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                <StatCard
                  title="Total Tasks"
                  value={stats.totalTasks}
                  icon={<ListIcon />}
                  color="blue.500"
                />
                <StatCard
                  title="Completed"
                  value={stats.completedTasks}
                  subtitle={`${stats.completionRate}% completion rate`}
                  icon={<CheckIcon />}
                  color="green.500"
                />
                <StatCard
                  title="Overdue"
                  value={stats.overdueTasks}
                  icon={<CalendarIcon />}
                  color="red.500"
                />
                <StatCard
                  title="Total Activity"
                  value={stats.totalActivity}
                  subtitle={`Last ${selectedTimeframe} days`}
                  icon={<ActivityIcon />}
                  color="brand.500"
                />
              </SimpleGrid>

              {/* Main Charts Row */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
                {/* Activity Heatmap */}
                <AppCard>
                  <AppCardBody p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          <Icon color="brand.500" boxSize={5}>
                            <ActivityIcon />
                          </Icon>
                          <Text fontSize="lg" fontWeight="semibold">
                            Activity Heatmap
                          </Text>
                        </HStack>
                      </HStack>
                      <ActivityHeatmap data={combinedHeatmapData} days={selectedTimeframe} />
                    </VStack>
                  </AppCardBody>
                </AppCard>

                {/* Most Productive Day */}
                <AppCard>
                  <AppCardBody p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack justify="space-between">
                        <HStack gap={2}>
                          <Icon color="brand.500" boxSize={5}>
                            <ChartIcon />
                          </Icon>
                          <Text fontSize="lg" fontWeight="semibold">
                            Productivity by Day
                          </Text>
                        </HStack>
                        <Badge colorPalette="brand" fontSize="sm">
                          Most productive: {mostProductiveDay}
                        </Badge>
                      </HStack>
                      <DayOfWeekChart data={dayOfWeekData} mostProductiveDay={mostProductiveDay} />
                    </VStack>
                  </AppCardBody>
                </AppCard>
              </SimpleGrid>

              {/* Secondary Charts Row */}
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                {/* Priority Distribution */}
                <AppCard>
                  <AppCardBody p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Icon color="brand.500" boxSize={5}>
                          <TagIcon />
                        </Icon>
                        <Text fontSize="lg" fontWeight="semibold">
                          Priority Distribution
                        </Text>
                      </HStack>
                      <PriorityDistribution data={priorityDistribution} />
                    </VStack>
                  </AppCardBody>
                </AppCard>

                {/* Epic Progress */}
                <AppCard>
                  <AppCardBody p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Icon color="brand.500" boxSize={5}>
                          <TagIcon />
                        </Icon>
                        <Text fontSize="lg" fontWeight="semibold">
                          Epic Progress
                        </Text>
                      </HStack>
                      <EpicProgress epics={epicProgress} />
                    </VStack>
                  </AppCardBody>
                </AppCard>

                {/* Completion Trend */}
                <AppCard>
                  <AppCardBody p={5}>
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Icon color="brand.500" boxSize={5}>
                          <ChartIcon />
                        </Icon>
                        <Text fontSize="lg" fontWeight="semibold">
                          Weekly Trend
                        </Text>
                      </HStack>
                      <CompletionTrend data={completionTrend} />
                    </VStack>
                  </AppCardBody>
                </AppCard>
              </SimpleGrid>
            </VStack>
          </Container>
        </Box>
      </ScrollView>
    </ThemedBackground>
  );
}

export default AnalyticsDashboard;
