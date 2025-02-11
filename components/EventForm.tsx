'use client';

import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from './ui/textarea';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Id } from '@/convex/_generated/dataModel';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStorageUrl } from '@/lib/utils';

const formSchema = z.object({
  name: z
    .string()
    .min(3, 'Event name is required and must be at least 3 characters.'),
  description: z.string().min(6, 'Required 6 characters...'),
  location: z.string().min(1, 'Location is required'),
  eventDate: z
    .date()
    .min(
      new Date(new Date().setHours(0, 0, 0, 0)),
      'Event date must be in the future',
    ),
  price: z.number().min(0, 'Price must be zero or grater then 0'),
  totalTickets: z.number().min(1, 'You must have at least one ticket'),
});

type FormData = z.infer<typeof formSchema>;

interface InitialEventData {
  _id: Id<'events'>;
  name: string;
  description: string;
  location: string;
  eventDate: number;
  price: number;
  totalTickets: number;
  imageStorageId?: Id<'_storage'>;
}

interface EventFormProps {
  mode: 'create' | 'edit';
  initialData?: InitialEventData;
}

export default function EventForm({ mode, initialData }: EventFormProps) {
  const { user } = useUser();
  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.updateEvent);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const currentImageUrl = useStorageUrl(initialData?.imageStorageId);

  //Image Upload
  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateEventImage = useMutation(api.storage.updateEventImage);
  const deleteImage = useMutation(api.storage.deleteImage);
  const [removedCurrentImage, setRemovedCurrentImage] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      location: initialData?.location ?? '',
      eventDate: initialData ? new Date(initialData.eventDate) : new Date(),
      price: initialData?.price ?? 0,
      totalTickets: initialData?.totalTickets ?? 1,
    },
  });

  //My onSubmit
  async function onSubmit(values: FormData) {
    if (!user?.id) return;

    startTransition(async () => {
      try {
        let imageStorageId = null;

        //Handle image changes
        if (selectedImage) {
          //Upload new Image
          imageStorageId = await handleImageUpload(selectedImage);
        }

        //Handle image delete/update in edit mode
        if (mode === 'edit' && initialData?.imageStorageId) {
          if (removedCurrentImage || selectedImage) {
            //Delete old Image from storage
            await deleteImage({
              storageId: initialData.imageStorageId,
            });
          }
        }

        //Handle create Image
        if (mode === 'create') {
          const eventId = await createEvent({
            ...values,
            userId: user.id,
            eventDate: values.eventDate.getTime(),
          });

          if (imageStorageId) {
            await updateEventImage({
              eventId,
              storageId: imageStorageId as Id<'_storage'>,
            });
          }

          router.push(`/event/${eventId}`);
        } else {
          //Ensure initialData exists before proceeding with update
          if (!initialData) {
            throw new Error('Initial event data is required for updates');
          }

          //Update Event Details
          await updateEvent({
            eventId: initialData._id,
            ...values,
            eventDate: values.eventDate.getTime(),
            // userId: '',
          });

          //Update Image (this will now handle both adding new / removing Image)
          if (imageStorageId || removedCurrentImage) {
            await updateEventImage({
              eventId: initialData._id,
              //If there's a new image, use the ID, otherwise if we're removing the image, press null
              storageId: imageStorageId
                ? (imageStorageId as Id<'_storage'>)
                : null,
            });
          }

          toast({
            title: 'Event Updated',
            description: 'Your event has been successfully updated.',
          });

          router.push(`/event/${initialData._id}`);
        }
      } catch (error) {
        console.error('Failed to handle event: ', error);
        toast({
          variant: 'destructive',
          title: 'It looks that something went wrong',
          description: 'There was a problem with your request.',
        });
      }
    });
  }

  async function handleImageUpload(file: File): Promise<string | null> {
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error('Failed to upload image: ', error);
      return null;
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {/* Form Files */}
        <div className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder='Event Name' {...field} />
                </FormControl>
                <FormDescription>
                  This is your Event public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder='Event description' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='Event location' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='eventDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Date</FormLabel>
                <FormControl>
                  <Input
                    type='date'
                    {...field}
                    onChange={(e) => {
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null,
                      );
                    }}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split('T')[0]
                        : ''
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per ticket</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <span className='absolute left-2 top-1/2 -translate-y-1/2'>
                      €
                    </span>
                    <Input
                      type='number'
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className='pl-6'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='totalTickets'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total tickets available</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload */}
          <div className='space-y-4'>
            <label
              // htmlFor='image'
              className='block text-sm font-medium text-gray-700'
            >
              Event Image
            </label>
            <div className='mt-1 flex items-center gap-4'>
              {imagePreview || (!removedCurrentImage && currentImageUrl) ? (
                <div className='relative aspect-square w-32 rounded-lg bg-gray-100'>
                  <Image
                    src={imagePreview || currentImageUrl!}
                    alt='Preview'
                    fill
                    className='rounded-lg object-contain'
                  />
                  <button
                    type='button'
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setRemovedCurrentImage(true);
                      if (imageInput.current) {
                        imageInput.current.value = '';
                      }
                    }}
                    className='absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600'
                  >
                    x
                  </button>
                </div>
              ) : (
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                  ref={imageInput}
                  className='block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
                />
              )}
            </div>
          </div>
        </div>

        <Button
          type='submit'
          disabled={isPending}
          className='flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-blue-900'
        >
          {isPending ? (
            <>
              <Loader2 className='size-4 animate-spin' />
              {mode === 'create' ? 'Creating Event...' : 'updating Event...'}
            </>
          ) : mode === 'create' ? (
            'Create Event'
          ) : (
            'Update Event'
          )}
        </Button>
      </form>
    </Form>
  );
}
