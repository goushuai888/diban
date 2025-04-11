<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import AppLayout from '@/components/common/AppLayout.vue';
import { useStudentStore } from '@/stores/studentStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'vue-sonner';
import { CheckCircle, AlertCircle, Edit, Lock, Loader2, RefreshCw, Users, Search, Clock, Award, CheckSquare, BookOpen } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/composables/useDebounce';

// Initialize Pinia stores for state management
const studentStore = useStudentStore(); // Manages student data
const authStore = useAuthStore(); // Manages authentication state

// General component state
const isLoading = ref(false); // Tracks loading state for data fetching
const error = ref<string | null>(null); // Stores any error messages during data fetching

// State for the "Grade Student" dialog
const gradeDialogOpen = ref(false); // Controls visibility of the grade dialog
const selectedStudent = ref<string | null>(null); // ID of the student being graded
const selectedReportType = ref<'progress' | 'final'>('progress'); // Type of report being graded
const gradeInputValue = ref<number | null>(null); // Input value for the grade
const isSubmitting = ref(false); // Tracks if the grade submission is in progress
const gradeSubmitError = ref<string | null>(null); // Stores errors related to grade submission

// State for student filtering and sorting
const searchQuery = ref(''); // Input value for searching students
const isSearching = ref(false); // Tracks if a search operation is in progress
const statusFilter = ref('all'); // Filter students by status ('all', 'finalized', 'in-progress')
const sortBy = ref('name'); // Field to sort students by ('name', 'progress', 'final', 'status')
const sortOrder = ref('asc'); // Sort order ('asc' or 'desc')

// State for managing tabs
const activeTab = ref('assigned'); // Currently selected tab ('assigned' or 'reports')
const isPendingTabChange = ref(false); // Flag for tab transition animation

// Computed property to get the list of students assigned to the current teacher, applying filters and sorting
const assignedStudents = computed(() => {
  let students = studentStore.getStudentsForCurrentUser; // Get students from store getter
  
  // Apply search filter (case-insensitive)
  if (searchQuery.value) {
    students = students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  // Apply status filter
  if (statusFilter.value === 'finalized') {
    students = students.filter(student => student.finalized);
  } else if (statusFilter.value === 'in-progress') {
    students = students.filter(student => !student.finalized);
  }
  
  // Apply sorting based on selected field and order
  return students.sort((a, b) => {
    let comparison = 0;
    if (sortBy.value === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy.value === 'progress') {
      // Handle potentially null grades, treating null as -1 for sorting
      const aGrade = a.progressReportGrade ?? -1;
      const bGrade = b.progressReportGrade ?? -1;
      comparison = aGrade - bGrade;
    } else if (sortBy.value === 'final') {
      // Handle potentially null grades
      const aGrade = a.finalReportGrade ?? -1;
      const bGrade = b.finalReportGrade ?? -1;
      comparison = aGrade - bGrade;
    } else if (sortBy.value === 'status') {
      // Sort by finalized status (finalized = 1, in-progress = 0)
      comparison = (a.finalized ? 1 : 0) - (b.finalized ? 1 : 0);
    }
    
    // Reverse comparison if sort order is descending
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
});

// Computed property to calculate statistics for the dashboard cards based on assigned students
const stats = computed(() => ({
  total: assignedStudents.value.length, // Total number of assigned students
  finalized: assignedStudents.value.filter(s => s.finalized).length, // Number of students with finalized records
  inProgress: assignedStudents.value.filter(s => !s.finalized).length, // Number of students with records in progress
  graded: assignedStudents.value.filter(s => 
    s.progressReportGrade !== null || s.finalReportGrade !== null // Number of students with at least one grade entered
  ).length
}));

// Fetch initial student data when the component mounts
onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  document.title = 'Teacher Dashboard'; // Set page title
  try {
    await studentStore.fetchStudents(); // Fetch all students (store getter will filter)
    if (studentStore.error) throw new Error(studentStore.error); // Check for errors from the store
  } catch (err: any) {
    error.value = err.message || 'Failed to load assigned students.';
    toast.error('Error loading data', { description: error.value || undefined });
  } finally {
    isLoading.value = false;
  }
});

// Debounced function for handling student search input
const debouncedSearch = useDebounce((query: string) => {
  // Note: The current implementation searches across *all* students, 
  // not just assigned ones. The computed property `assignedStudents` handles filtering.
  // If the search API could filter by teacher, this could be optimized.
  if (query.length === 0) {
    // If search is cleared, ensure the full list is available (refresh might not be strictly needed if store is up-to-date)
    // refreshData(); // Consider if a full refresh is needed or just clearing the query is enough
    return;
  }
  
  isSearching.value = true;
  studentStore.searchStudents(query) // Trigger search in the store
    .finally(() => {
      isSearching.value = false;
    });
}, 300); // 300ms debounce delay

// Watch for changes in the search query and trigger the debounced search
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery);
});

// Opens the grade dialog and pre-populates data for the selected student and report type
const openGradeDialog = (studentId: string, reportType: 'progress' | 'final') => {
  const student = assignedStudents.value.find(s => s.id === studentId);
  if (!student) return; // Should not happen if UI is correct
  
  selectedStudent.value = studentId;
  selectedReportType.value = reportType;
  // Pre-fill grade input with existing grade, if any
  gradeInputValue.value = reportType === 'progress' 
    ? student.progressReportGrade ?? null // Use null if no grade exists
    : student.finalReportGrade ?? null;
  gradeDialogOpen.value = true; // Open the dialog
  gradeSubmitError.value = null; // Reset any previous error messages
};

// Handles submitting the grade entered in the dialog
const submitGrade = async () => {
  // Basic validation
  if (!selectedStudent.value || gradeInputValue.value === null) {
    gradeSubmitError.value = 'Grade value is required.';
    return;
  }
  if (gradeInputValue.value < 0 || gradeInputValue.value > 100) {
    gradeSubmitError.value = 'Grade must be between 0 and 100.';
    return;
  }
  
  isSubmitting.value = true;
  gradeSubmitError.value = null;
  
  try {
    // Call the store action to update the grade
    await studentStore.gradeStudent(
      selectedStudent.value, 
      selectedReportType.value, 
      gradeInputValue.value
    );
    
    toast.success('Grade submitted successfully');
    gradeDialogOpen.value = false; // Close dialog on success
    // Reset dialog state
    selectedStudent.value = null;
    gradeInputValue.value = null;
  } catch (err: any) {
    gradeSubmitError.value = err.message || 'Failed to submit grade. Please try again.';
    toast.error('Failed to submit grade', {
      description: gradeSubmitError.value || undefined,
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Handles finalizing a student's record via the store action
const finalizeRecord = async (studentId: string) => {
  try {
    await studentStore.finalizeRecord(studentId);
    toast.success('Student record finalized successfully');
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to finalize student record.';
    toast.error('Error finalizing record', { description: errorMessage });
  }
  // Note: The UI updates reactively based on the store change
};

// Refreshes the student data from the server
const refreshData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    await studentStore.fetchStudents(); // Re-fetch student data
    if (studentStore.error) throw new Error(studentStore.error); // Check for errors
    toast.success('Data refreshed successfully');
  } catch (err: any) {
    error.value = err.message || 'Failed to refresh data.';
    toast.error('Error refreshing data', { description: error.value || undefined });
  } finally {
    isLoading.value = false;
  }
};

// Resets all student filters and sorting to their default values
const resetFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  sortBy.value = 'name';
  sortOrder.value = 'asc';
  // Note: Clearing searchQuery might trigger debouncedSearch to refresh data if implemented that way
};

// Handles tab changes with a brief transition effect
const handleTabChange = (value: string) => {
  isPendingTabChange.value = true; // Start transition (fade out)
  activeTab.value = value;
  // Allow time for fade-out before fade-in (controlled by CSS)
  setTimeout(() => {
    isPendingTabChange.value = false; // End transition (fade in)
  }, 300); // Duration should match CSS transition duration
};

// Utility function to get a student's name by their ID for display purposes (e.g., in dialogs)
const getStudentName = (id: string | null): string => {
  if (!id) return 'Unknown Student';
  const student = assignedStudents.value.find(s => s.id === id);
  return student ? student.name : 'Unknown Student';
}
</script>

<template>
  <AppLayout>
    <div class="container mx-auto py-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold text-foreground">Teacher Dashboard</h2>
        <Button @click="refreshData" variant="outline" size="sm" :disabled="isLoading">
          <RefreshCw v-if="!isLoading" class="h-4 w-4 mr-2" />
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </Button>
      </div>

      <p class="text-muted-foreground mb-6">Welcome, {{ authStore.userName || 'Teacher' }}! Here you can manage your assigned students and their grades.</p>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-10">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading assigned students...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-destructive/10 text-destructive p-4 rounded-md flex items-center mb-6">
        <AlertCircle class="mr-2 h-5 w-5" />
        <div>
          <p class="font-medium">Error loading data</p>
          <p class="text-sm">{{ error }}</p>
        </div>
        <Button @click="refreshData" variant="destructive" size="sm" class="ml-auto">
          Try Again
        </Button>
      </div>

      <!-- Main Content Area -->
      <div v-else>
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Total Students</CardTitle>
              <Users class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ stats.total }}</div>
              <p class="text-xs text-muted-foreground">Assigned to you</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Finalized Records</CardTitle>
              <CheckSquare class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ stats.finalized }}</div>
              <p class="text-xs text-muted-foreground">No further changes allowed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">In Progress</CardTitle>
              <Clock class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ stats.inProgress }}</div>
              <p class="text-xs text-muted-foreground">Awaiting completion</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <CardTitle class="text-sm font-medium">Graded Students</CardTitle>
              <Award class="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ stats.graded }}</div>
              <p class="text-xs text-muted-foreground">With at least one grade</p>
            </CardContent>
          </Card>
        </div>

        <!-- Main Content Tabs -->
        <Tabs v-model="activeTab" class="w-full">
            <div class="border-b mb-6">
            <TabsList class="inline-flex h-auto sm:h-12 flex-wrap sm:flex-nowrap items-center justify-center rounded-md bg-muted p-1 w-full">
              <!-- Assigned Students Tab Trigger -->
              <TabsTrigger 
              value="assigned" 
              class="flex-1 min-w-[150px] inline-flex items-center justify-center whitespace-nowrap px-3 sm:px-5 py-2 sm:py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-md"
              @click="handleTabChange('assigned')"
              >
              <Users class="h-4 w-4 mr-1 sm:mr-2" />
              <span class="truncate">Assigned Students</span>
              <Badge class="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-xs">{{ stats.total }}</Badge>
              </TabsTrigger>
              <!-- Report Overview Tab Trigger -->
              <TabsTrigger 
              value="reports" 
              class="flex-1 min-w-[150px] inline-flex items-center justify-center whitespace-nowrap px-3 sm:px-5 py-2 sm:py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-md"
              @click="handleTabChange('reports')"
              >
              <BookOpen class="h-4 w-4 mr-1 sm:mr-2" />
              <span class="truncate">Report Overview</span>
              </TabsTrigger>
            </TabsList>
            </div>
          
          <!-- Assigned Students Tab Content -->
          <TabsContent 
            value="assigned" 
            class="mt-0 transition-all"
            :class="{ 'opacity-0': isPendingTabChange && activeTab === 'assigned', 'opacity-100': !isPendingTabChange && activeTab === 'assigned' }"
          >
            <!-- Search and Filter Controls -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 py-4 rounded-lg">
              <div class="flex items-center space-x-2 flex-1">
                <div class="relative w-full max-w-xs">
                  <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    class="pl-8"
                    v-model="searchQuery" 
                    :disabled="isSearching"
                  />
                  <Loader2 v-if="isSearching" class="absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />
                </div>
                <!-- Add filter dropdowns here if needed -->
              </div>
              
              <!-- Quick Stats Badges -->
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="bg-green-50/50">
                  <CheckCircle class="h-3 w-3 mr-1 text-green-600" /> 
                  Finalized: {{ stats.finalized }}
                </Badge>
                <Badge variant="outline" class="bg-yellow-50/50">
                  <Clock class="h-3 w-3 mr-1 text-yellow-600" />
                  In Progress: {{ stats.inProgress }}
                </Badge>
              </div>
            </div>

            <!-- Students Table Card -->
            <div class="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div class="p-4 border-b">
                <h3 class="text-lg font-medium">Assigned Students</h3>
                <p class="text-sm text-muted-foreground mt-1">
                  Manage student reports and grades
                </p>
              </div>
              
              <!-- Empty State: No Assigned Students -->
              <div v-if="assignedStudents.length === 0 && !searchQuery" class="bg-muted p-8 text-center">
                <p class="text-muted-foreground">You currently have no students assigned.</p>
              </div>
              <!-- Empty State: No Matching Students -->
              <div v-else-if="assignedStudents.length === 0 && searchQuery" class="bg-muted p-8 text-center">
                <p class="text-muted-foreground">No students match your search criteria.</p>
                <Button variant="link" @click="resetFilters" class="mt-2">Reset Filters</Button>
              </div>
              <!-- Student Table -->
              <div v-else>
                <Table>
                  <TableHeader class="bg-muted/50">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Progress Report</TableHead>
                      <TableHead>Final Report</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead class="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow 
                      v-for="student in assignedStudents" 
                      :key="student.id" 
                      :class="[
                        studentStore.isProcessing(student.id) ? 'opacity-70' : '', // Dim row if processing
                        student.finalized ? 'bg-green-50/30' : '' // Highlight finalized rows
                      ]"
                    >
                      <TableCell>{{ student.name }}</TableCell>
                      <TableCell>
                        <!-- Progress Grade Display -->
                        <div class="flex items-center gap-1">
                          <Badge 
                            v-if="student.progressReportGrade !== null" 
                            variant="outline" 
                            :class="{'bg-blue-50 text-blue-700': student.progressReportGrade >= 60}"
                          >
                            {{ student.progressReportGrade }}/100
                          </Badge>
                          <span v-else class="text-muted-foreground text-sm">Not graded</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <!-- Final Grade Display -->
                        <div class="flex items-center gap-1">
                          <Badge 
                            v-if="student.finalReportGrade !== null" 
                            variant="outline" 
                            :class="{'bg-blue-50 text-blue-700': student.finalReportGrade >= 60}"
                          >
                            {{ student.finalReportGrade }}/100
                          </Badge>
                          <span v-else class="text-muted-foreground text-sm">Not graded</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <!-- Status Badge -->
                        <Badge v-if="student.finalized" variant="outline" class="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle class="h-3 w-3 mr-1" /> Finalized
                        </Badge>
                        <Badge v-else variant="outline" class="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock class="h-3 w-3 mr-1" /> In Progress
                        </Badge>
                      </TableCell>
                      <TableCell class="text-right">
                        <!-- Action Buttons -->
                        <div class="flex justify-end gap-2">
                          <!-- Grade Progress Button (only if not finalized) -->
                          <Button 
                            v-if="!student.finalized"
                            variant="outline" 
                            size="sm"
                            @click="openGradeDialog(student.id, 'progress')"
                            :disabled="studentStore.isProcessing(student.id)"
                          >
                            <Edit class="h-4 w-4 mr-1" /> Progress
                          </Button>
                          <!-- Grade Final Button (only if not finalized) -->
                          <Button 
                            v-if="!student.finalized"
                            variant="outline" 
                            size="sm"
                            @click="openGradeDialog(student.id, 'final')"
                            :disabled="studentStore.isProcessing(student.id)"
                          >
                            <Edit class="h-4 w-4 mr-1" /> Final
                          </Button>
                          <!-- Finalize Confirmation Dialog Trigger (only if not finalized and final grade exists) -->
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                v-if="!student.finalized && student.finalReportGrade !== null"
                                variant="default" 
                                size="sm"
                                :disabled="studentStore.isProcessing(student.id)"
                              >
                                <Lock class="h-4 w-4 mr-1" /> Finalize
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Finalize Student Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will finalize the student record for {{ student.name }}. After finalization, no further changes can be made to the grades.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  @click="finalizeRecord(student.id)"
                                  class="bg-primary"
                                >
                                  Finalize
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <!-- Processing Indicator -->
                          <div v-if="studentStore.isProcessing(student.id)" class="inline-flex ml-2">
                            <Loader2 class="h-4 w-4 animate-spin" />
                          </div>
                          <!-- Message for finalized records -->
                          <div v-if="student.finalized" class="text-gray-500 text-sm italic">No further changes can be made</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <!-- Reports Overview Tab Content -->
          <TabsContent 
            value="reports" 
            class="mt-0 transition-all"
            :class="{ 'opacity-0': isPendingTabChange && activeTab === 'reports', 'opacity-100': !isPendingTabChange && activeTab === 'reports' }"
          >
            <div class="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div class="p-4 border-b">
                <h3 class="text-lg font-medium">Report Overview</h3>
                <p class="text-sm text-muted-foreground mt-1">
                  At-a-glance view of student progress and final reports
                </p>
              </div>
              
              <div class="p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Progress Reports Summary Card -->
                  <div class="border rounded-md overflow-hidden">
                    <div class="bg-blue-50/50 p-3 border-b">
                      <h4 class="font-medium flex items-center">
                        <BookOpen class="h-4 w-4 mr-2" /> 
                        Progress Reports
                      </h4>
                    </div>
                    <div class="p-4">
                      <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                          <span>Completed:</span>
                          <span class="font-medium">
                            {{ assignedStudents.filter(s => s.progressReportGrade !== null).length }} of {{ assignedStudents.length }}
                          </span>
                        </div>
                        <!-- Progress Bar -->
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                          <div class="bg-blue-600 h-2.5 rounded-full" :style="{
                            width: `${(assignedStudents.filter(s => s.progressReportGrade !== null).length / Math.max(assignedStudents.length, 1)) * 100}%`
                          }"></div>
                        </div>
                        <!-- Recently Graded List -->
                        <div class="pt-2">
                          <h5 class="text-sm font-medium mb-2">Recently Graded</h5>
                          <div class="space-y-2">
                            <div v-for="student in assignedStudents.filter(s => s.progressReportGrade !== null).slice(0, 3)" :key="`progress-${student.id}`" class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                              <span>{{ student.name }}</span>
                              <Badge variant="outline" :class="{'bg-green-50 text-green-700': student.progressReportGrade && student.progressReportGrade >= 60, 'bg-red-50 text-red-700': student.progressReportGrade && student.progressReportGrade < 60, 'bg-gray-50 text-gray-700': student.progressReportGrade === null}">
                                {{ student.progressReportGrade !== null ? student.progressReportGrade : 'Not graded' }} / 100
                              </Badge>
                            </div>
                            <div v-if="!assignedStudents.some(s => s.progressReportGrade !== null)" class="text-center text-sm text-muted-foreground p-2">
                              No progress reports graded yet
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Final Reports Summary Card -->
                  <div class="border rounded-md overflow-hidden">
                    <div class="bg-green-50/50 p-3 border-b">
                      <h4 class="font-medium flex items-center">
                        <Award class="h-4 w-4 mr-2" /> 
                        Final Reports
                      </h4>
                    </div>
                    <div class="p-4">
                      <div class="space-y-3">
                        <div class="flex justify-between text-sm">
                          <span>Completed:</span>
                          <span class="font-medium">
                            {{ assignedStudents.filter(s => s.finalReportGrade !== null).length }} of {{ assignedStudents.length }}
                          </span>
                        </div>
                        <!-- Progress Bar -->
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                          <div class="bg-green-600 h-2.5 rounded-full" :style="{
                            width: `${(assignedStudents.filter(s => s.finalReportGrade !== null).length / Math.max(assignedStudents.length, 1)) * 100}%`
                          }"></div>
                        </div>
                        <!-- Recently Graded List -->
                        <div class="pt-2">
                          <h5 class="text-sm font-medium mb-2">Recently Graded</h5>
                          <div class="space-y-2">
                            <div v-for="student in assignedStudents.filter(s => s.finalReportGrade !== null).slice(0, 3)" :key="`final-${student.id}`" class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                              <span>{{ student.name }}</span>
                              <Badge variant="outline" :class="{'bg-green-50 text-green-700': student.finalReportGrade && student.finalReportGrade >= 60, 'bg-red-50 text-red-700': student.finalReportGrade && student.finalReportGrade < 60, 'bg-gray-50 text-gray-700': student.finalReportGrade === null}">
                                {{ student.finalReportGrade !== null ? student.finalReportGrade : 'Not graded' }} / 100
                              </Badge>
                            </div>
                            <div v-if="!assignedStudents.some(s => s.finalReportGrade !== null)" class="text-center text-sm text-muted-foreground p-2">
                              No final reports graded yet
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Overall Status Summary -->
                <div class="mt-6 border rounded-md overflow-hidden">
                  <div class="bg-gray-50 p-3 border-b">
                    <h4 class="font-medium">Overall Status</h4>
                  </div>
                  <div class="p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <!-- Finalized Students Status -->
                      <div class="flex flex-col">
                        <span class="text-sm text-muted-foreground">Finalized Students</span>
                        <div class="text-2xl font-bold mt-1">{{ stats.finalized }}</div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div class="bg-green-600 h-1.5 rounded-full" :style="{
                            width: `${(stats.finalized / Math.max(stats.total, 1)) * 100}%`
                          }"></div>
                        </div>
                        <span class="text-xs text-muted-foreground mt-1">{{ Math.round((stats.finalized / Math.max(stats.total, 1)) * 100) }}% complete</span>
                      </div>
                      
                      <!-- Progress Reports Graded Status -->
                      <div class="flex flex-col">
                        <span class="text-sm text-muted-foreground">Progress Reports Graded</span>
                        <div class="text-2xl font-bold mt-1">{{ assignedStudents.filter(s => s.progressReportGrade !== null).length }}</div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div class="bg-blue-600 h-1.5 rounded-full" :style="{
                            width: `${(assignedStudents.filter(s => s.progressReportGrade !== null).length / Math.max(stats.total, 1)) * 100}%`
                          }"></div>
                        </div>
                        <span class="text-xs text-muted-foreground mt-1">
                          {{ Math.round((assignedStudents.filter(s => s.progressReportGrade !== null).length / Math.max(stats.total, 1)) * 100) }}% complete
                        </span>
                      </div>
                      
                      <!-- Final Reports Graded Status -->
                      <div class="flex flex-col">
                        <span class="text-sm text-muted-foreground">Final Reports Graded</span>
                        <div class="text-2xl font-bold mt-1">{{ assignedStudents.filter(s => s.finalReportGrade !== null).length }}</div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div class="bg-purple-600 h-1.5 rounded-full" :style="{
                            width: `${(assignedStudents.filter(s => s.finalReportGrade !== null).length / Math.max(stats.total, 1)) * 100}%`
                          }"></div>
                        </div>
                        <span class="text-xs text-muted-foreground mt-1">
                          {{ Math.round((assignedStudents.filter(s => s.finalReportGrade !== null).length / Math.max(stats.total, 1)) * 100) }}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </AppLayout>
  
  <!-- Grade Student Dialog -->
  <Dialog v-model:open="gradeDialogOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ selectedReportType === 'progress' ? 'Progress Report' : 'Final Report' }} Grade</DialogTitle>
        <DialogDescription>
          Enter the grade for {{ getStudentName(selectedStudent) }}'s {{ selectedReportType }} report.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="grade" class="text-right">
            Grade
          </Label>
          <div class="col-span-3">
            <Input
              id="grade"
              type="number"
              min="0"
              max="100"
              :model-value="gradeInputValue ?? undefined" 
              @update:model-value="gradeInputValue = $event === '' ? null : Number($event)"
              placeholder="Enter grade (0-100)"
              :disabled="isSubmitting"
            />
            <!-- Display validation/submission errors -->
            <p v-if="gradeSubmitError" class="text-red-500 text-sm mt-2">{{ gradeSubmitError }}</p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="gradeDialogOpen = false" :disabled="isSubmitting">Cancel</Button>
        <Button @click="submitGrade" :disabled="isSubmitting || gradeInputValue === null || gradeInputValue < 0 || gradeInputValue > 100">
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          Submit Grade
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Basic transition for tab content opacity and other properties */
.transition-all {
  transition: all 0.2s ease;
}
</style>