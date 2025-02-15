import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// RLS has been disabled, so we don't need to create policies anymore

import React from "react";
export const queryClient = new QueryClient();
export function SupabaseProvider({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const fromSupabase = async (query) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

/* supabase integration types

### user_table

| name       | type                     | format | required |
|------------|--------------------------|--------|----------|
| id         | int8                     | number | true     |
| created_at | timestamp with time zone | string | true     |
| last_upd   | timestamp with time zone | string | true     |
| user_id    | text                     | string | true     |
| password   | text                     | string | true     |
| user_type  | text                     | string | true     |
| user_org   | text                     | string | true     |

### dsr_tracker

| name        | type                     | format | required |
|-------------|--------------------------|--------|----------|
| id          | int8                     | number | true     |
| created_dt  | timestamp with time zone | string | true     |
| po_number   | text                     | string | true     |
| last_upd_dt | timestamp with time zone | string | true     |
| last_upd_by | text                     | string | true     |
| created_by  | text                     | string | true     |
| comments    | json                     | object | true     |

*/

// Hooks for user_table

export const useUserTable = () => useQuery({
    queryKey: ['user_table'],
    queryFn: () => fromSupabase(supabase.from('user_table').select('*')),
});

export const useUserTableById = (id) => useQuery({
    queryKey: ['user_table', id],
    queryFn: () => fromSupabase(supabase.from('user_table').select('*').eq('id', id).single()),
});

export const useAddUserTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newUser) => fromSupabase(supabase.from('user_table').insert([newUser])),
        onSuccess: () => {
            queryClient.invalidateQueries('user_table');
        },
    });
};

export const useUpdateUserTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('user_table').update(updateData).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('user_table');
        },
    });
};

export const useDeleteUserTable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('user_table').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('user_table');
        },
    });
};

// Hooks for user_org

export const useUserOrg = () => useQuery({
    queryKey: ['user_org'],
    queryFn: async () => {
        const { data, error } = await supabase.from('user_org').select('id, org_name').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
});

export const useAddUserOrg = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newOrg) => {
            console.log('Mutation function received:', newOrg);
            const sanitizedOrg = {
                ...newOrg,
                created_by: newOrg.created_by || 'system',
                last_upd_by: newOrg.last_upd_by || 'system'
            };
            console.log('Sanitized organization data:', sanitizedOrg);
            return fromSupabase(supabase.from('user_org').insert([sanitizedOrg]));
        },
        onSuccess: () => {
            queryClient.invalidateQueries('user_org');
        },
        onError: (error) => {
            console.error('Error adding organization:', error);
            throw error;
        },
    });
};

export const useUpdateUserOrg = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, org_name, last_upd, last_upd_by }) => 
            fromSupabase(supabase.from('user_org').update({ 
                org_name, 
                last_upd, 
                last_upd_by 
            }).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('user_org');
        },
        onError: (error) => {
            console.error('Error updating organization:', error);
            throw error;
        },
    });
};

export const useDeleteUserOrg = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('user_org').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('user_org');
        },
    });
};

// Hooks for dsr_tracker

export const useDsrTracker = (page, pageSize, searchId, sortField, sortDirection, userType, userOrg) => useQuery({
    queryKey: ['dsr_tracker', page, pageSize, searchId, sortField, sortDirection, userType, userOrg],
    queryFn: async () => {
        let query = supabase.from('dsr_tracker').select('*', { count: 'exact' });

        if (searchId) {
            query = query.ilike('po_number', `%${searchId}%`);
        }

        if (userType === 'Guest' && userOrg) {
            query = query.eq('user_org', userOrg);
        }

        query = query.order(sortField, { ascending: sortDirection === 'asc' })
                     .range((page - 1) * pageSize, page * pageSize - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        return { data, total: count };
    },
});

export const useDsrTrackerById = (id) => useQuery({
    queryKey: ['dsr_tracker', id],
    queryFn: () => fromSupabase(supabase.from('dsr_tracker').select('*').eq('id', id).single()),
});

export const useAddDsrTracker = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newDsr) => fromSupabase(supabase.from('dsr_tracker').insert([newDsr])),
        onSuccess: () => {
            queryClient.invalidateQueries('dsr_tracker');
        },
    });
};

export const useUpdateDsrTracker = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...updateData }) => fromSupabase(supabase.from('dsr_tracker').update(updateData).eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('dsr_tracker');
        },
    });
};

export const useDeleteDsrTracker = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fromSupabase(supabase.from('dsr_tracker').delete().eq('id', id)),
        onSuccess: () => {
            queryClient.invalidateQueries('dsr_tracker');
        },
    });
};
