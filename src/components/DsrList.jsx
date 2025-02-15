import { useState, useEffect } from 'react';
import { useDsrTracker, useUpdateDsrTracker, useDeleteDsrTracker } from '../integrations/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserTable } from '../integrations/supabase';
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from '../integrations/supabase/auth';
import { format } from 'date-fns';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { logError } from '../utils/errorLogging.js';

const DsrList = () => {
  const [searchId, setSearchId] = useState('');
  const [updateComment, setUpdateComment] = useState('');
  const [selectedDsr, setSelectedDsr] = useState(null);
  const [sortField, setSortField] = useState('last_upd_dt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { session } = useSupabaseAuth();
  const { data: userData } = useUserTable();

  const userAccess = {
    type: session?.user?.user_type || 'Guest',
    org: userData?.find(u => u.user_id === session?.user?.user_id)?.user_org || ''
  };

  const isGuest = userAccess.type === 'Guest';

  const { data, isLoading, isError, refetch } = useDsrTracker(
    currentPage,
    itemsPerPage,
    searchId,
    sortField,
    sortDirection,
    userAccess.type,
    userAccess.org
  );
  const updateDsrMutation = useUpdateDsrTracker();
  const deleteDsrMutation = useDeleteDsrTracker();

  useEffect(() => {
    refetch();
  }, [currentPage, itemsPerPage, searchId, sortField, sortDirection, userAccess.type, userAccess.org]);

  const dsrs = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / itemsPerPage);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedDsrs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DSR List");
    XLSX.writeFile(workbook, "dsr_list.xlsx");
    toast.success("DSR list exported successfully!", {
      description: "The Excel file has been downloaded to your device.",
    });
  };

  const handleUpdate = async (dsr) => {
    if (!session?.user || session.user.user_type === 'Guest') {
      toast.error('You do not have permission to update DSRs.');
      return;
    }
    if (!updateComment.trim()) return;

    const currentTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX");
    const updatedComments = JSON.parse(dsr.comments || '[]');
    updatedComments.push({
      date: currentTime,
      user: session.user.user_id,
      comment: updateComment
    });

    try {
      await updateDsrMutation.mutateAsync({
        id: dsr.id,
        comments: JSON.stringify(updatedComments),
        last_upd_dt: currentTime,
        last_upd_by: session.user.user_id
      });
      setUpdateComment('');
      setSelectedDsr(null);
      toast.success("Great job! DSR updated successfully!", {
        description: "Your changes have been saved and the DSR is now up-to-date.",
      });
      // TODO: Implement WhatsApp and email notifications here
    } catch (error) {
      logError('Error updating DSR:', error);
      toast.error('Failed to update DSR. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (session.user.user_type === 'Guest') {
      toast.error('Guest users are not allowed to delete DSRs.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this DSR?')) {
      try {
        await deleteDsrMutation.mutateAsync(id);
        toast.success("DSR deleted successfully!", {
          description: "The DSR has been removed from the system. Good job keeping things organized!",
        });
      } catch (error) {
        logError('Error deleting DSR:', error);
        toast.error('Failed to delete DSR. Please try again.');
      }
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading DSRs. Please try refreshing the page.</div>;

  return (
    <div className="space-y-4">
      <Input
        type="text"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
        placeholder="Search by Tracking ID"
      />
      <Button onClick={exportToExcel} className="mb-4">Export to Excel</Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('po_number')} className="cursor-pointer">
              Tracking ID <ArrowUpDown className="inline-block ml-1" size={16} />
            </TableHead>
            <TableHead onClick={() => handleSort('created_dt')} className="cursor-pointer">
              Created <ArrowUpDown className="inline-block ml-1" size={16} />
            </TableHead>
            <TableHead onClick={() => handleSort('created_by')} className="cursor-pointer">
              Created By <ArrowUpDown className="inline-block ml-1" size={16} />
            </TableHead>
            <TableHead onClick={() => handleSort('last_upd_dt')} className="cursor-pointer">
              Last Updated <ArrowUpDown className="inline-block ml-1" size={16} />
            </TableHead>
            <TableHead onClick={() => handleSort('last_upd_by')} className="cursor-pointer">
              Last Updated By <ArrowUpDown className="inline-block ml-1" size={16} />
            </TableHead>
            <TableHead onClick={() => handleSort('user_org')} className="cursor-pointer">
              Organization <ArrowUpDown className="inline-block ml-1" size={16} />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dsrs.map((dsr) => (
            <TableRow key={dsr.id}>
              <TableCell>{dsr.po_number}</TableCell>
              <TableCell>{new Date(dsr.created_dt).toLocaleString()}</TableCell>
              <TableCell>{dsr.created_by}</TableCell>
              <TableCell>{new Date(dsr.last_upd_dt).toLocaleString()}</TableCell>
              <TableCell>{dsr.last_upd_by}</TableCell>
              <TableCell>{dsr.user_org}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedDsr(dsr)}>View</Button>
                  </DialogTrigger>
                  <DialogContent className={cn("sm:max-w-[425px] md:max-w-[600px]", "max-h-[80vh] overflow-y-auto")}>
                    <DialogHeader>
                      <DialogTitle>DSR Details</DialogTitle>
                    </DialogHeader>
                    {selectedDsr && (
                      <div className="mt-2">
                        <h3 className="font-bold">Tracking ID: {selectedDsr.po_number}</h3>
                        <p>Created: {new Date(selectedDsr.created_dt).toLocaleString()}</p>
                        <p>Last Updated: {new Date(selectedDsr.last_upd_dt).toLocaleString()}</p>
                        <p>Organization: {selectedDsr.user_org}</p>
                        <h4 className="font-semibold mt-2">Comments:</h4>
                        <div className="mt-4 max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {JSON.parse(selectedDsr.comments || '[]').map((comment, index) => (
                                <tr key={index}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(comment.date).toLocaleString()}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{comment.user}</td>
                                  <td className="px-3 py-2 text-sm text-gray-500">{comment.comment}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {userAccess.type !== 'Guest' && (
                          <div className="mt-2">
                            <Textarea
                              value={updateComment}
                              onChange={(e) => setUpdateComment(e.target.value)}
                              placeholder="Add a new comment"
                            />
                            <Button onClick={() => handleUpdate(selectedDsr)} className="mt-2">Update</Button>
                            {userAccess.type === 'TSV-Admin' && (
                              <Button onClick={() => handleDelete(selectedDsr.id)} variant="destructive" className="mt-2 ml-2">Delete</Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default DsrList;
