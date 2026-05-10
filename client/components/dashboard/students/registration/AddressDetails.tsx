"use client";
import { useState } from "react";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";

import { UseFormReturn } from "react-hook-form";
import { StudentRegistrationValues } from "@/lib/validators/student";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface AddressDetailsProps {
    form: UseFormReturn<StudentRegistrationValues>;
}

export default function AddressDetails({ form }: AddressDetailsProps) {
    const [isGeocoding, setIsGeocoding] = useState(false);

    const handleGeocode = async () => {
        const address = form.getValues("currentAddress");
        const city = form.getValues("city");
        const state = form.getValues("state");
        const pincode = form.getValues("pincode");

        if (!address || !city) {
            alert("Please enter street address and city to geocode.");
            return;
        }

        const fullAddress = `${address}, ${city}, ${state} ${pincode}`;
        setIsGeocoding(true);

        try {
            // @ts-ignore
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
                if (status === "OK" && results[0]) {
                    const { lat, lng } = results[0].geometry.location;
                    form.setValue("latitude", lat());
                    form.setValue("longitude", lng());
                    alert("Location precision verified via Google Maps!");
                } else {
                    alert("Geocoding failed: " + status);
                }
                setIsGeocoding(false);
            });
        } catch (err) {
            console.error(err);
            alert("Google Maps not loaded yet or API key missing.");
            setIsGeocoding(false);
        }
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle>Address Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Address */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium">Current Address</h4>
                    <FormField
                        control={form.control}
                        name="currentAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Street Address" className="resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pincode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pincode <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Pincode" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-slate-50 relative overflow-hidden group">
                        <div className="space-y-1 flex-1">
                            <h5 className="text-sm font-bold flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Precise Geolocation
                            </h5>
                            <p className="text-xs text-muted-foreground italic">Required for automated "Nearest Stop" suggestions in Transport module.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <FormField
                                    control={form.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Latitude" readOnly className="bg-white/50 text-xs font-mono h-8" {...field} value={field.value || ''} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Longitude" readOnly className="bg-white/50 text-xs font-mono h-8" {...field} value={field.value || ''} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            onClick={handleGeocode}
                            disabled={isGeocoding}
                            className="bg-primary text-white hover:bg-primary/90 font-black rounded-full px-4"
                        >
                            {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verify Point</div>}
                        </Button>
                    </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium">Permanent Address</h4>
                        <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>

                    <FormField
                        control={form.control}
                        name="permanentAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Permanent Address" className="resize-none" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>


            </CardContent>
        </Card>
    );
}
