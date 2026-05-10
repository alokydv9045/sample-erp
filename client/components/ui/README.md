# shadcn/ui Components for EduSphere ERP

This directory contains all the essential shadcn/ui components needed for the School ERP dashboard.

## Created Components

### 1. Button (`button.tsx`)
Button component with multiple variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon).

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="lg">Outline</Button>
```

### 2. Card (`card.tsx`)
Card components including Card, CardHeader, CardTitle, CardDescription, CardContent, and CardFooter.

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Student Information</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### 3. Input (`input.tsx`)
Styled input component for forms.

**Usage:**
```tsx
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="Email" />
```

### 4. Label (`label.tsx`)
Label component for form fields using Radix UI primitives.

**Usage:**
```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="email">Email Address</Label>
```

### 5. Table (`table.tsx`)
Complete table components: Table, TableHeader, TableBody, TableRow, TableCell, TableHead, TableCaption, TableFooter.

**Usage:**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Grade</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>A</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 6. Dialog (`dialog.tsx`)
Modal dialog components: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose.

**Usage:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### 7. Dropdown Menu (`dropdown-menu.tsx`)
Dropdown menu components with full Radix UI support.

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 8. Select (`select.tsx`)
Select components for dropdowns: Select, SelectTrigger, SelectContent, SelectItem, SelectValue.

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select grade" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Grade A</SelectItem>
    <SelectItem value="b">Grade B</SelectItem>
  </SelectContent>
</Select>
```

### 9. Tabs (`tabs.tsx`)
Tab components: Tabs, TabsList, TabsTrigger, TabsContent.

**Usage:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="students">
  <TabsList>
    <TabsTrigger value="students">Students</TabsTrigger>
    <TabsTrigger value="teachers">Teachers</TabsTrigger>
  </TabsList>
  <TabsContent value="students">Students content</TabsContent>
  <TabsContent value="teachers">Teachers content</TabsContent>
</Tabs>
```

### 10. Badge (`badge.tsx`)
Badge component with variants (default, secondary, destructive, outline).

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Active</Badge>
<Badge variant="destructive">Inactive</Badge>
```

### 11. Avatar (`avatar.tsx`)
Avatar components: Avatar, AvatarImage, AvatarFallback.

**Usage:**
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### 12. Form (`form.tsx`)
Form components integrated with react-hook-form: Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage.

**Usage:**
```tsx
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const form = useForm()

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### 13. Toast & Sonner (`toast.tsx`, `sonner.tsx`, `toaster.tsx`)
Toast notification system with two implementations.

**Toast Usage:**
```tsx
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

// In your component
const { toast } = useToast()

toast({
  title: "Success!",
  description: "Your changes have been saved.",
})

// Add <Toaster /> to your root layout
```

**Sonner Usage:**
```tsx
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

// In your component
toast.success("Changes saved!")

// Add <Toaster /> to your root layout
```

## File Structure

```
/home/ahqafcoder/Desktop/Github/EduSphere/erp/client/
├── components/
│   └── ui/
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── index.ts
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── sonner.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── toaster.tsx
│       └── toast.tsx
└── hooks/
    └── use-toast.ts
```

## Dependencies Required

Make sure these packages are installed:

```bash
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-icons react-hook-form sonner next-themes
```

All components are:
- Fully typed with TypeScript
- Built with Radix UI primitives
- Styled with Tailwind CSS
- Using class-variance-authority for variant management
- Production-ready and accessible
- Following shadcn/ui patterns

## Notes

1. The `form.tsx` component requires `react-hook-form` to be installed.
2. The `sonner.tsx` component requires the `sonner` package and `next-themes` for theme support.
3. All components use the `cn()` utility from `/lib/utils.ts` for className merging.
4. Components follow the official shadcn/ui patterns and are fully customizable.
