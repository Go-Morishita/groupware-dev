interface SessionProps {
    session: Session | null;
}

interface AttendanceRecord {
    date: Date;
    clockIn: Date;
    clockOut: Date;
}

interface Stamp {
    date: Date;
    clock_in: Date;
    clock_out: Date;
}

type LocalStorageStamp = {
    stamp_id: string;
    work_now: boolean;
};

interface Task {
    id: number;
    title: string;
    description: string;
    progress: number;
    deadline: string; // <- Date から string に変更
    status: string;
    manager_id: number;
    assigner_id: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    image: string
    role: string;
    work_now: boolean;
}

interface Report {
    id: number;
    task_id: number;
    pre_progress: number;
    progress: number;
    comment: string | null; // コメントがない場合もあるかもしれないので null 許容
    created_at?: Date;
}

interface NestedTaskData {
    id: number;
    title: string;
    description: string;
    deadline: string;
    assigner_id: number;
    users: Pick<User, 'name'> | null;
}

interface ReportWithDetails {
    id: number;
    task_id: number;
    pre_progress: number;
    progress: number;
    comment: string | null;
    created_at?: string;
    tasks: NestedTaskData | null;
}