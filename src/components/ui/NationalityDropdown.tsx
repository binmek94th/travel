// components/ui/NationalityDropdown.tsx
import Dropdown, { DropdownOption } from "@/src/components/ui/Dropdown";

export const NATIONALITIES = [
    "Afghan", "Albanian", "Algerian", "American", "Argentinian", "Australian",
    "Austrian", "Bangladeshi", "Belgian", "Brazilian", "British", "Bulgarian",
    "Canadian", "Chilean", "Chinese", "Colombian", "Croatian", "Czech", "Danish",
    "Dutch", "Egyptian", "Ethiopian", "Finnish", "French", "German", "Greek",
    "Hungarian", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
    "Italian", "Japanese", "Jordanian", "Kenyan", "Korean", "Lebanese", "Malaysian",
    "Mexican", "Moroccan", "Nigerian", "Norwegian", "Pakistani", "Peruvian",
    "Philippine", "Polish", "Portuguese", "Romanian", "Russian", "Saudi",
    "Serbian", "Singaporean", "South African", "Spanish", "Swedish", "Swiss",
    "Syrian", "Taiwanese", "Thai", "Turkish", "Ukrainian", "Emirati", "Venezuelan",
    "Vietnamese", "Other",
];


export const NATIONALITY_OPTIONS: DropdownOption[] = NATIONALITIES.map(n => ({
    label: n, value: n,
}));

export default function NationalityDropdown({
                                                value,
                                                onChange,
                                                placeholder = "Select nationality",
                                                width = "w-full",
                                            }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    width?: string;
}) {
    return (
        <Dropdown
            searchable
            options={NATIONALITY_OPTIONS}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            width={width}
        />
    );
}