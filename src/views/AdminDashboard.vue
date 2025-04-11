// src/views/AdminDashboard.vue
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import AppLayout from '@/components/common/AppLayout.vue';
import { useStudentStore } from '@/stores/studentStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { toast } from 'vue-sonner';
import { UserPlus, AlertCircle, UserCheck, Loader2, CheckCircle, X, Users, User, RefreshCw, Trash2, Search } from 'lucide-vue-next';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { useDebounce } from '@/composables/useDebounce';

// Initialize Pinia stores for state management
const studentStore = useStudentStore();
const teacherStore = useTeacherStore();

// General component state
const isLoading = ref(false); // Tracks loading state for data fetching
const error = ref<string | null>(null); // Stores any error messages during data fetching

// State for managing tabs
const activeTab = ref('students'); // Currently selected tab ('students' or 'teachers')
const isPendingTabChange = ref(false); // Flag for tab transition animation

// State for student filtering and sorting
const studentSearchQuery = ref(''); // Input value for searching students
const isSearching = ref(false); // Tracks if a search operation is in progress
const showFinalized = ref(true); // Filter toggle for finalized students
const showInProgress = ref(true); // Filter toggle for in-progress students
const studentSortBy = ref('name'); // Field to sort students by ('name', 'progress', 'final')
const studentSortOrder = ref('asc'); // Sort order ('asc' or 'desc')

// State for the "Add Student" dialog
const addStudentDialogOpen = ref(false); // Controls visibility of the add student dialog
const newStudentName = ref(''); // Input value for the new student's name
const isAddingStudent = ref(false); // Tracks if the add student operation is in progress
const addStudentError = ref<string | null>(null); // Stores errors related to adding a student

// State for the "Assign Teacher" dialog
const assignTeacherDialogOpen = ref(false); // Controls visibility of the assign teacher dialog
const selectedStudentId = ref<string | null>(null); // ID of the student being assigned a teacher
const selectedTeacherId = ref<string | null>(null); // ID of the teacher selected for assignment
const isAssigningTeacher = ref(false); // Tracks if the assign teacher operation is in progress
const assignTeacherError = ref<string | null>(null); // Stores errors related to assigning a teacher

// State for the "Delete Student" confirmation dialog
const deleteDialogOpen = ref(false); // Controls visibility of the delete confirmation dialog
const studentToDelete = ref<string | null>(null); // ID of the student marked for deletion
const isDeletingStudent = ref(false); // Tracks if the delete operation is in progress

// State for the "Unfinalize Record" confirmation dialog
const unfinalizeDialogOpen = ref(false); // Controls visibility of the unfinalize confirmation dialog
const studentToUnfinalize = ref<string | null>(null); // ID of the student whose record is to be unfinalized
const isUnfinalizingStudent = ref(false); // Tracks if the unfinalize operation is in progress

// Debounced function for handling student search input
const debouncedSearch = useDebounce((query: string) => {
  if (query.length === 0) {
    // If search is cleared, fetch all students again
    refreshData();
    return;
  }
  
  isSearching.value = true;
  studentStore.searchStudents(query)
    .finally(() => {
      isSearching.value = false;
    });
}, 300); // 300ms debounce delay

// Watch for changes in the student search query and trigger the debounced search
watch(studentSearchQuery, (newQuery) => {
  debouncedSearch(newQuery);
});

// Fetch initial data when the component mounts
onMounted(async () => {
  isLoading.value = true;
  error.value = null;
  document.title = 'Admin Dashboard'; // Set page title
  try {
    // Fetch students and teachers concurrently
    await Promise.all([
      studentStore.fetchStudents(),
      teacherStore.fetchTeachers()
    ]);
    // Check for errors from stores
    if (studentStore.error) throw new Error(studentStore.error);
    if (teacherStore.error) throw new Error(teacherStore.error);
  } catch (err: any) {
    error.value = err.message || 'Failed to load dashboard data.';
    toast.error('Error loading data', { description: error.value || undefined });
  } finally {
    isLoading.value = false;
  }
});

// Handles adding a new student via the dialog
const addStudent = async () => {
  // Basic validation
  if (!newStudentName.value.trim()) {
    addStudentError.value = 'Student name is required';
    return;
  }
  
  isAddingStudent.value = true;
  addStudentError.value = null;
  
  try {
    await studentStore.addStudent(newStudentName.value.trim());
    toast.success(`Student ${newStudentName.value} added successfully`);
    addStudentDialogOpen.value = false; // Close dialog on success
    newStudentName.value = ''; // Reset input field
  } catch (err: any) {
    addStudentError.value = err.message || 'Failed to add student';
    toast.error('Failed to add student', {
      description: addStudentError.value || undefined
    });
  } finally {
    isAddingStudent.value = false;
  }
};

// Opens the "Assign Teacher" dialog and pre-populates data
const openAssignTeacherDialog = (studentId: string) => {
  selectedStudentId.value = studentId;
  const student = studentStore.students.find(s => s.id === studentId);
  // Pre-select current teacher if one is assigned
  selectedTeacherId.value = student?.assignedTeacherId || null;
  assignTeacherDialogOpen.value = true;
  assignTeacherError.value = null; // Reset error message
};

// Handles assigning a selected teacher to a student
const assignTeacher = async () => {
  // Basic validation
  if (!selectedStudentId.value || !selectedTeacherId.value) {
    assignTeacherError.value = 'Please select a teacher';
    return;
  }
  
  isAssigningTeacher.value = true;
  assignTeacherError.value = null;
  
  try {
    await studentStore.assignTeacher(selectedStudentId.value, selectedTeacherId.value);
    toast.success('Teacher assigned successfully');
    assignTeacherDialogOpen.value = false; // Close dialog on success
    // Reset dialog state
    selectedStudentId.value = null;
    selectedTeacherId.value = null;
  } catch (err: any) {
    assignTeacherError.value = err.message || 'Failed to assign teacher';
    toast.error('Failed to assign teacher', {
      description: assignTeacherError.value || undefined
    });
  } finally {
    isAssigningTeacher.value = false;
  }
};

// Opens the "Delete Student" confirmation dialog
const openDeleteDialog = (studentId: string) => {
  studentToDelete.value = studentId;
  deleteDialogOpen.value = true;
};

// Handles the confirmation and deletion of a student
const confirmDeleteStudent = async () => {
  if (!studentToDelete.value) return; // Guard clause
  
  isDeletingStudent.value = true;
  
  try {
    await studentStore.deleteStudent(studentToDelete.value);
    toast.success('Student deleted successfully');
    deleteDialogOpen.value = false; // Close dialog on success
    studentToDelete.value = null; // Reset state
  } catch (err: any) {
    toast.error('Failed to delete student', {
      description: err.message || 'An error occurred'
    });
  } finally {
    isDeletingStudent.value = false;
  }
};

// Opens the "Unfinalize Record" confirmation dialog
const openUnfinalizeDialog = (studentId: string) => {
  studentToUnfinalize.value = studentId;
  unfinalizeDialogOpen.value = true;
};

// Handles the confirmation and unfinalization of a student record
const confirmUnfinalizeStudent = async () => {
  if (!studentToUnfinalize.value) return; // Guard clause
  
  isUnfinalizingStudent.value = true;
  
  try {
    await studentStore.unfinalizeRecord(studentToUnfinalize.value);
    toast.success('Student record unfinalized successfully');
    unfinalizeDialogOpen.value = false; // Close dialog on success
    studentToUnfinalize.value = null; // Reset state
  } catch (err: any) {
    toast.error('Failed to unfinalize student record', {
      description: err.message || 'An error occurred'
    });
  } finally {
    isUnfinalizingStudent.value = false;
  }
};

// Refreshes both student and teacher data from the server
const refreshData = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    await Promise.all([
      studentStore.fetchStudents(),
      teacherStore.fetchTeachers()
    ]);
    // Check for errors from stores after fetching
    if (studentStore.error) throw new Error(studentStore.error);
    if (teacherStore.error) throw new Error(teacherStore.error);
    toast.success('Data refreshed successfully');
  } catch (err: any) {
    error.value = err.message || 'Failed to refresh data.';
    toast.error('Error refreshing data', { description: error.value || undefined });
  } finally {
    isLoading.value = false;
  }
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

// Computed property to get the list of students based on current filters and sorting
const filteredStudents = computed(() => {
  return studentStore.students.filter(student => {
    // Apply search query filter (case-insensitive)
    const matchesSearch = student.name.toLowerCase().includes(studentSearchQuery.value.toLowerCase());
    
    // Apply status filters (show finalized/in-progress)
    const matchesStatus = (
      (student.finalized && showFinalized.value) ||
      (!student.finalized && showInProgress.value)
    );
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Apply sorting based on selected field and order
    let comparison = 0;
    if (studentSortBy.value === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (studentSortBy.value === 'progress') {
      // Handle potentially null grades, treating null as -1 for sorting
      const aGrade = a.progressReportGrade ?? -1;
      const bGrade = b.progressReportGrade ?? -1;
      comparison = aGrade - bGrade;
    } else if (studentSortBy.value === 'final') {
      // Handle potentially null grades
      const aGrade = a.finalReportGrade ?? -1;
      const bGrade = b.finalReportGrade ?? -1;
      comparison = aGrade - bGrade;
    }
    
    // Reverse comparison if sort order is descending
    return studentSortOrder.value === 'asc' ? comparison : -comparison;
  });
});

// Toggles the visibility filter for finalized students
const toggleFinalizedFilter = () => {
  showFinalized.value = !showFinalized.value;
};

// Toggles the visibility filter for in-progress students
const toggleInProgressFilter = () => {
  showInProgress.value = !showInProgress.value;
};

// Resets all student filters and sorting to their default values
const resetFilters = () => {
  studentSearchQuery.value = '';
  showFinalized.value = true;
  showInProgress.value = true;
  studentSortBy.value = 'name';
  studentSortOrder.value = 'asc';
  // Note: This also implicitly triggers a data refresh via the search query watcher
};
</script>

<template>
  <AppLayout>
    <div class="container mx-auto py-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold text-foreground">Admin Dashboard</h2>
        <Button @click="refreshData" variant="outline" size="sm" :disabled="isLoading">
          <RefreshCw v-if="!isLoading" class="h-4 w-4" />
          <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </Button>
      </div>

      <p class="text-muted-foreground mb-6">Welcome, Admin! Here you can manage students and teachers in the system.</p>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-10">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading dashboard data...</p>
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
        <Tabs v-model="activeTab" class="w-full">
            <div class="border-b mb-6">
              <TabsList class="inline-flex h-auto sm:h-12 flex-wrap sm:flex-nowrap items-center justify-center rounded-md bg-muted p-1 w-full">
                <!-- Students Tab Trigger -->
                <TabsTrigger 
                value="students" 
                class="flex-1 min-w-[150px] inline-flex items-center justify-center whitespace-nowrap px-3 sm:px-5 py-2 sm:py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-md"
                @click="handleTabChange('students')"
                >
                <Users class="h-4 w-4 mr-1 sm:mr-2" />
                <span class="truncate">Student Management</span>
                <Badge class="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-xs">{{ studentStore.students.length }}</Badge>
                </TabsTrigger>
                <!-- Teachers Tab Trigger -->
                <TabsTrigger 
                value="teachers" 
                class="flex-1 min-w-[150px] inline-flex items-center justify-center whitespace-nowrap px-3 sm:px-5 py-2 sm:py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow rounded-md"
                @click="handleTabChange('teachers')"
                >
                <User class="h-4 w-4 mr-1 sm:mr-2" />
                <span class="truncate">Teacher Information</span>
                <Badge class="ml-1 sm:ml-2 bg-blue-100 text-blue-800 text-xs">{{ teacherStore.teachers.length }}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>
          
          <!-- Students Tab Content -->
          <TabsContent 
            value="students" 
            class="mt-0 transition-all"
            :class="{ 'opacity-0': isPendingTabChange && activeTab === 'students', 'opacity-100': !isPendingTabChange && activeTab === 'students' }"
          >
            <!-- Student Search and Add Button Row -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 py-4 rounded-lg">
              <div class="flex items-center space-x-2 flex-1">
                <div class="relative w-full max-w-xs">
                  <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    class="pl-8"
                    v-model="studentSearchQuery" 
                    :disabled="isSearching"
                  />
                  <Loader2 v-if="isSearching" class="absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />
                </div> 
              </div>
              
              <!-- Add Student Dialog Trigger -->
              <Dialog v-model:open="addStudentDialogOpen">
                <DialogTrigger asChild>
                  <Button size="sm" class="whitespace-nowrap">
                    <UserPlus class="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Enter the name of the student you want to add to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                      <Label for="studentName" class="text-right">Name</Label>
                      <Input
                        id="studentName"
                        v-model="newStudentName"
                        placeholder="Enter student name"
                        class="col-span-3"
                        :disabled="isAddingStudent"
                      />
                    </div>
                    <p v-if="addStudentError" class="text-red-500 text-sm">{{ addStudentError }}</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" @click="addStudentDialogOpen = false" :disabled="isAddingStudent">Cancel</Button>
                    <Button @click="addStudent" :disabled="isAddingStudent || !newStudentName.trim()">
                      <Loader2 v-if="isAddingStudent" class="mr-2 h-4 w-4 animate-spin" />
                      Add Student
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <!-- Student Table Card -->
            <div class="bg-card rounded-lg border shadow-sm overflow-hidden">
              <!-- Card Header with Filters -->
              <div class="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 class="text-lg font-medium">Student Management</h3>
                
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <!-- Finalized Filter Badge -->
                  <Badge variant="outline" class="cursor-pointer" :class="showFinalized ? 'bg-green-50' : ''" @click="toggleFinalizedFilter">
                    <CheckCircle v-if="showFinalized" class="h-3 w-3 mr-1" /> 
                    Finalized ({{ studentStore.students.filter(s => s.finalized).length }})
                  </Badge>
                  
                  <!-- In Progress Filter Badge -->
                  <Badge variant="outline" class="cursor-pointer" :class="showInProgress ? 'bg-yellow-50' : ''" @click="toggleInProgressFilter">
                    <CheckCircle v-if="showInProgress" class="h-3 w-3 mr-1" />
                    In Progress ({{ studentStore.students.filter(s => !s.finalized).length }})
                  </Badge>
                  
                  <span class="hidden sm:inline">|</span>
                  <span>Total: {{ studentStore.students.length }}</span>
                </div>
              </div>
            
              <!-- Empty State: No Students -->
              <div v-if="studentStore.students.length === 0" class="bg-muted p-8 text-center">
                <p class="text-muted-foreground">No students in the system. Add a student to get started.</p>
              </div>
              <!-- Empty State: No Matching Students -->
              <div v-else-if="filteredStudents.length === 0" class="bg-muted p-8 text-center">
                <p class="text-muted-foreground">No students match your search criteria.</p>
                <Button variant="link" @click="resetFilters" class="mt-2">Reset Filters</Button>
              </div>
              <!-- Student Table -->
              <div v-else>
                <Table>
                  <TableHeader class="bg-muted/50">
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Assigned Teacher</TableHead>
                      <TableHead>Progress Grade</TableHead>
                      <TableHead>Final Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead class="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="student in filteredStudents" :key="student.id"
                      :class="[
                        studentStore.isProcessing(student.id) ? 'opacity-70' : '', // Dim row if processing
                        student.finalized ? 'bg-green-50/30' : '' // Highlight finalized rows
                      ]"
                    >
                      <TableCell>{{ student.name }}</TableCell>
                      <TableCell>{{ teacherStore.getTeacherName(student.assignedTeacherId) }}</TableCell>
                      <TableCell>
                        <span v-if="typeof student.progressReportGrade === 'number'">
                          {{ student.progressReportGrade }}/100
                        </span>
                        <span v-else class="text-muted-foreground">Not graded</span>
                      </TableCell>
                      <TableCell>
                        <span v-if="typeof student.finalReportGrade === 'number'">
                          {{ student.finalReportGrade }}/100
                        </span>
                        <span v-else class="text-muted-foreground">Not graded</span>
                      </TableCell>
                      <TableCell>
                        <!-- Status Badge -->
                        <Badge v-if="student.finalized" variant="outline" class="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle class="h-3 w-3 mr-1" /> Finalized
                        </Badge>
                        <Badge v-else variant="outline" class="bg-yellow-50 text-yellow-700 border-yellow-200">
                          In Progress
                        </Badge>
                      </TableCell>
                      <TableCell class="text-right">
                        <!-- Action Buttons -->
                        <div class="flex justify-end space-x-2">
                          <!-- Assign Teacher Button (only if not finalized) -->
                          <Button 
                            v-if="!student.finalized"
                            variant="outline" 
                            size="sm"
                            @click="openAssignTeacherDialog(student.id)"
                            :disabled="studentStore.isProcessing(student.id)"
                          >
                            <UserCheck class="h-4 w-4 mr-1" /> Assign Teacher
                          </Button>
                          <!-- Unfinalize Button (only if finalized) -->
                          <Button
                            v-if="student.finalized"
                            variant="outline"
                            size="sm"
                            @click="openUnfinalizeDialog(student.id)"
                            :disabled="studentStore.isProcessing(student.id)"
                          >
                            <X class="h-4 w-4 mr-1" /> Unfinalize
                          </Button>
                          <!-- Delete Button (only if not finalized) -->
                          <Button
                            v-if="!student.finalized"
                            variant="destructive"
                            size="sm"
                            @click="openDeleteDialog(student.id)"
                            :disabled="studentStore.isProcessing(student.id)"
                          >
                            <Trash2 class="h-4 w-4 mr-1" /> Delete
                          </Button>
                          <!-- Processing Indicator -->
                          <div v-if="studentStore.isProcessing(student.id)" class="inline-flex ml-2">
                            <Loader2 class="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <!-- Teachers Tab Content -->
          <TabsContent 
            value="teachers" 
            class="mt-0 transition-all"
            :class="{ 'opacity-0': isPendingTabChange && activeTab === 'teachers', 'opacity-100': !isPendingTabChange && activeTab === 'teachers' }"
          >
            <!-- Teacher Table Card -->
            <div class="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div class="p-4 border-b">
                <h3 class="text-lg font-medium">Teacher Information</h3>
                <p class="text-sm text-muted-foreground mt-1">
                  View all teachers and their assigned students
                </p>
              </div>
              
              <!-- Empty State: No Teachers -->
              <div v-if="teacherStore.teachers.length === 0" class="bg-muted p-8 text-center">
                <p class="text-muted-foreground">No teachers in the system.</p>
              </div>
              <!-- Teacher Table -->
              <div v-else>
                <Table>
                  <TableHeader class="bg-muted/50">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Assigned Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="teacher in teacherStore.teachers" :key="teacher.id">
                      <TableCell class="font-mono text-xs">{{ teacher.id }}</TableCell>
                      <TableCell>{{ teacher.name }}</TableCell>
                      <TableCell>
                        <!-- Assigned Student Count Badge -->
                        <Badge class="bg-blue-100 text-blue-800 border-none">
                          {{ studentStore.students.filter(s => s.assignedTeacherId === teacher.id).length }}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <!-- Placeholder for future teacher actions -->
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </AppLayout>
  
  <!-- Assign Teacher Dialog -->
  <Dialog v-model:open="assignTeacherDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Assign Teacher</DialogTitle>
        <DialogDescription>
          Select a teacher to assign to this student.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="teacherSelect" class="text-right">Teacher</Label>
          <div class="col-span-3">
            <Select v-model="selectedTeacherId">
              <SelectTrigger id="teacherSelect">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="teacher in teacherStore.teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="assignTeacherError" class="text-red-500 text-sm mt-2">{{ assignTeacherError }}</p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="assignTeacherDialogOpen = false" :disabled="isAssigningTeacher">Cancel</Button>
        <Button @click="assignTeacher" :disabled="isAssigningTeacher || !selectedTeacherId">
          <Loader2 v-if="isAssigningTeacher" class="mr-2 h-4 w-4 animate-spin" />
          Assign
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete Student Confirmation Dialog -->
  <Dialog v-model:open="deleteDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this student? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="deleteDialogOpen = false" :disabled="isDeletingStudent">Cancel</Button>
        <Button variant="destructive" @click="confirmDeleteStudent" :disabled="isDeletingStudent">
          <Loader2 v-if="isDeletingStudent" class="mr-2 h-4 w-4 animate-spin" />
          Delete Student
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  
  <!-- Unfinalize Student Record Confirmation Dialog -->
  <Dialog v-model:open="unfinalizeDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Unfinalize Student Record</DialogTitle>
        <DialogDescription>
          Are you sure you want to unfinalize this student record? This will allow modifications to be made again.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="unfinalizeDialogOpen = false" :disabled="isUnfinalizingStudent">Cancel</Button>
        <Button @click="confirmUnfinalizeStudent" :disabled="isUnfinalizingStudent">
          <Loader2 v-if="isUnfinalizingStudent" class="mr-2 h-4 w-4 animate-spin" />
          Unfinalize Record
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Basic transition for tab content opacity */
.transition-all {
  transition: opacity 0.2s ease-in-out;
}
</style>