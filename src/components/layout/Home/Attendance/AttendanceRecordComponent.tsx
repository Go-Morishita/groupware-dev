'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress
} from '@mui/material';

const AttendanceRecordComponent = ({ session }: SessionProps) => {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // API 経由で出勤データを取得
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // email をクエリパラメータとして渡す
                const res = await fetch(`/api/stamps?email=${session?.user?.email}`);

                const data = await res.json();

                if (data.error) {
                    console.error('取得エラー:', data.error);
                    setError('データの取得に失敗しました。');
                    setLoading(false);
                    return;
                }

                // clock_in と clock_out 両方が存在するデータのみを利用
                const records = data
                    .filter((item: any) => item.clock_in && item.clock_out)
                    .map((item: any) => ({
                        date: new Date(item.clock_in),
                        clockIn: new Date(item.clock_in),
                        clockOut: new Date(item.clock_out),
                    }));

                setAttendanceRecords(records);
            } catch (err) {
                console.error('通信エラー:', err);
                setError('通信エラーが発生しました。');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 日付・時刻・労働時間計算系の関数
    const formatDate = (date: Date) => date.toLocaleDateString();
    const formatTime = (date: Date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const computeWorkingMinutes = (clockIn: Date, clockOut: Date) =>
        Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
    const formatWorkingMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remMinutes = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${remMinutes
            .toString()
            .padStart(2, '0')}`;
    };

    const totalWorkingMinutes = attendanceRecords.reduce(
        (total, record) =>
            total + computeWorkingMinutes(record.clockIn, record.clockOut),
        0
    );

    return (
        <TableContainer component={Paper} sx={{ backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" component="div" sx={{ padding: 2 }}>
                2025年4月
            </Typography>

            {loading ? (
                <div className="flex justify-center py-8">
                    <CircularProgress />
                </div>
            ) : error ? (
                <Typography color="error" sx={{ padding: 2 }}>
                    {error}
                </Typography>
            ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>日付</TableCell>
                            <TableCell>出勤</TableCell>
                            <TableCell>退勤</TableCell>
                            <TableCell>労働時間</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {attendanceRecords.map((record, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ color: 'blue' }}>
                                    {formatDate(record.date)}
                                </TableCell>
                                <TableCell sx={{ color: 'blue' }}>
                                    {formatTime(record.clockIn)}
                                </TableCell>
                                <TableCell sx={{ color: 'blue' }}>
                                    {formatTime(record.clockOut)}
                                </TableCell>
                                <TableCell sx={{ color: 'blue' }}>
                                    {formatWorkingMinutes(
                                        computeWorkingMinutes(record.clockIn, record.clockOut)
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={3} align="right">
                                <strong>総労働時間</strong>
                            </TableCell>
                            <TableCell sx={{ color: 'blue' }}>
                                {formatWorkingMinutes(totalWorkingMinutes)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}
        </TableContainer>
    );
};

export default AttendanceRecordComponent;
