import {useState} from "react";
import {inputCls} from "@/src/components/admin/ui";
import {Controller} from "react-hook-form";
import MapPicker from "@/src/components/ui/MapPicker";
import Dropdown, {DropdownOption} from "@/src/components/ui/Dropdown";

function ItineraryDayCard({
                              index, total, register, control, errors, onMoveUp, onMoveDown, onRemove,
                          }: {
    index: number;
    total: number;
    register: any;
    control: any;
    errors: any;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
}) {
    const [showMap, setShowMap] = useState(false);

    const TRANSPORT_OPTIONS: DropdownOption[] = [
        { label: "Driving 🚗", value: "driving" },
        { label: "Walking 🚶", value: "walking" },
        { label: "Flying ✈️", value: "flying" },
        { label: "Boat 🚤", value: "boat" },
    ];

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-visible">
            {/* Day header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                        <button type="button" onClick={onMoveUp} disabled={index === 0}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-25 transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M6 9V3M3 6l3-3 3 3"/>
                            </svg>
                        </button>
                        <button type="button" onClick={onMoveDown} disabled={index === total - 1}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 disabled:opacity-25 transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M6 3v6M3 6l3 3 3-3"/>
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[0.6rem] font-bold text-white">
              {index + 1}
            </span>
                        <span className="text-xs font-semibold text-slate-600">Day {index + 1}</span>
                    </div>
                </div>
                <button type="button" onClick={onRemove}
                        className="text-slate-400 hover:text-red-400 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M3 3l10 10M13 3L3 13"/>
                    </svg>
                </button>
            </div>

            {/* Day content */}
            <div className="p-3 flex flex-col gap-2.5">
                <input
                    {...register(`itinerary.${index}.title`)}
                    className={`${inputCls} ${errors.itinerary?.[index]?.title ? "border-red-400" : ""}`}
                    placeholder="Day title (e.g. Arrival in Lalibela)"
                />
                {errors.itinerary?.[index]?.title && (
                    <p className="text-xs text-red-500">{errors.itinerary[index]?.title?.message}</p>
                )}

                <textarea
                    {...register(`itinerary.${index}.description`)}
                    className={`${inputCls} min-h-[70px] resize-y ${errors.itinerary?.[index]?.description ? "border-red-400" : ""}`}
                    placeholder="What happens this day…"
                />
                {errors.itinerary?.[index]?.description && (
                    <p className="text-xs text-red-500">{errors.itinerary[index]?.description?.message}</p>
                )}

                {/* Location toggle */}
                <div className="border-t border-slate-200 pt-2.5">
                    <button
                        type="button"
                        onClick={() => setShowMap(v => !v)}
                        className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                            showMap ? "text-cyan-600" : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <path d="M8 1C5.79 1 4 2.79 4 5c0 4 4 10 4 10s4-6 4-10c0-2.21-1.79-4-4-4z"/>
                            <circle cx="8" cy="5" r="1.5"/>
                        </svg>
                        {showMap ? "Hide location" : "Pin location for this day"}
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-400">optional</span>
                        <svg
                            className={`w-3 h-3 ml-auto transition-transform ${showMap ? "rotate-180" : ""}`}
                            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M2 4l4 4 4-4"/>
                        </svg>
                    </button>

                    {showMap && (
                        <div className="mt-2.5 flex flex-col gap-2">
                            <Controller
                                name={`itinerary.${index}.latitude`}
                                control={control}
                                render={({ field: latField }) => (
                                    <Controller
                                        name={`itinerary.${index}.longitude`}
                                        control={control}
                                        render={({ field: lngField }) => (
                                            <MapPicker
                                                latitude={latField.value ?? ""}
                                                longitude={lngField.value ?? ""}
                                                onChange={(lat, lng) => {
                                                    latField.onChange(lat || "");
                                                    lngField.onChange(lng || "");
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />

                            <Controller
                                name={`itinerary.${index}.transportMode`}
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        options={TRANSPORT_OPTIONS}
                                        value={field.value ?? "driving"}
                                        onChange={field.onChange}
                                        placeholder="Transport mode"
                                        width="w-full"
                                    />
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ItineraryDayCard;