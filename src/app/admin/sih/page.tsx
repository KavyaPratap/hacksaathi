'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type SihInfo = {
    id: string;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
};

export default function AdminSihInfoPage() {
    const supabase = createClient();
    const [infos, setInfos] = useState<SihInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newInfo, setNewInfo] = useState({ title: '', content: '', image_url: '' });

    const fetchInfos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sih_info')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Failed to fetch SIH info", { description: error.message });
        } else {
            setInfos(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInfos();
    }, [supabase]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await supabase.from('sih_info').insert([newInfo]);
        if (error) {
            toast.error("Failed to create SIH info", { description: error.message });
        } else {
            toast.success("SIH info created successfully!");
            setNewInfo({ title: '', content: '', image_url: '' });
            fetchInfos();
        }
        setIsSubmitting(false);
    };
    
    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('sih_info').delete().eq('id', id);
        if (error) {
            toast.error("Failed to delete SIH info", { description: error.message });
        } else {
            toast.success("SIH info deleted successfully.");
            fetchInfos();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New SIH Announcement</CardTitle>
                    <CardDescription>This will be displayed on the user dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label htmlFor="title">Title</label>
                            <Input
                                id="title"
                                value={newInfo.title}
                                onChange={(e) => setNewInfo({ ...newInfo, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="content">Content</label>
                            <Textarea
                                id="content"
                                value={newInfo.content}
                                onChange={(e) => setNewInfo({ ...newInfo, content: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="image_url">Image URL</label>
                            <Input
                                id="image_url"
                                value={newInfo.image_url}
                                onChange={(e) => setNewInfo({ ...newInfo, image_url: e.target.value })}
                                placeholder="https://example.com/image.png"
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Create
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Info List */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Existing Announcements</h3>
                 {loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : infos.length === 0 ? (
                    <p className="text-muted-foreground">No SIH announcements yet.</p>
                ) : (
                    infos.map(info => (
                        <Card key={info.id} className="overflow-hidden">
                             {info.image_url && (
                                <div className="relative h-40 w-full">
                                    <Image src={info.image_url} alt={info.title} layout="fill" className="object-cover"/>
                                </div>
                             )}
                            <CardContent className="p-4">
                                <CardTitle className="text-lg">{info.title}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{info.content}</p>
                                <div className="flex justify-end mt-4">
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2"/> Delete</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the announcement "{info.title}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(info.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
