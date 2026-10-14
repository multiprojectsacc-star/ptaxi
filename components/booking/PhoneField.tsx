'use client';

import {useEffect, useId, useRef, useState} from 'react';
import PhoneInput, {getCountries, getCountryCallingCode, isPossiblePhoneNumber, parsePhoneNumber, type Country} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import pl from 'react-phone-number-input/locale/pl.json';
import en from 'react-phone-number-input/locale/en.json';
import {Popover} from 'radix-ui';
import {Command} from 'cmdk';
import {Check, ChevronDown, Search} from 'lucide-react';
import type {Locale} from '@/lib/booking';
import './PhoneField.css';

type CountrySelectProps = {
 value?: Country;
 onChange: (country: Country) => void;
 options: {value?: Country; label: string}[];
 locale: Locale;
 disabled?: boolean;
 readOnly?: boolean;
 onFocus?: () => void;
 onBlur?: () => void;
};

function CountryFlag({country}: {country: Country}) {
 const Flag = flags[country];
 return <span className="phone-country-flag" aria-hidden="true">{Flag && <Flag title=""/>}</span>;
}

function CountrySelect({value = 'PL', onChange, options, locale, disabled, readOnly, onFocus, onBlur}: CountrySelectProps) {
 const [open, setOpen] = useState(false);
 const [search, setSearch] = useState('');
 const label = options.find(option => option.value === value)?.label || value;
 const callingCode = getCountryCallingCode(value);
 const polish = locale === 'pl';

 return <Popover.Root open={open} onOpenChange={next => {setOpen(next); if (!next) setSearch('');}}>
  <Popover.Trigger asChild>
   <button type="button" className="phone-country-trigger" disabled={disabled || readOnly} onFocus={onFocus} onBlur={onBlur} aria-label={`${polish ? 'Kraj i kierunkowy' : 'Country and calling code'}: ${label} (+${callingCode})`}>
    <CountryFlag country={value}/><ChevronDown size={13} aria-hidden="true"/><span>+{callingCode}</span>
   </button>
  </Popover.Trigger>
  <Popover.Portal>
   <Popover.Content className="phone-country-popover" align="start" sideOffset={8} collisionPadding={16}>
    <Command label={polish ? 'Wybierz kraj i kierunkowy' : 'Choose country and calling code'}>
     <div className="phone-country-search"><Search size={16} aria-hidden="true"/><Command.Input value={search} onValueChange={setSearch} placeholder={polish ? 'Szukaj kraju lub kierunkowego' : 'Search country or calling code'} aria-label={polish ? 'Szukaj kraju lub kierunkowego' : 'Search country or calling code'}/></div>
     <Command.List className="phone-country-list" aria-label={polish ? 'Kraje i numery kierunkowe' : 'Countries and calling codes'}>
      <Command.Empty className="phone-country-empty">{polish ? 'Nie znaleziono kraju.' : 'No country found.'}</Command.Empty>
      {options.filter((option): option is {value: Country; label: string} => Boolean(option.value)).map(option => {
       const code = getCountryCallingCode(option.value);
       return <Command.Item key={option.value} className="phone-country-option" value={`${option.label} ${option.value} +${code}`} onSelect={() => {onChange(option.value); setOpen(false); setSearch('');}}>
        <CountryFlag country={option.value}/><span>{option.label}</span><span className="phone-country-code">+{code}</span>{option.value === value && <Check size={15} aria-hidden="true"/>}
       </Command.Item>;
      })}
     </Command.List>
    </Command>
   </Popover.Content>
  </Popover.Portal>
 </Popover.Root>;
}

export default function PhoneField({value, onChange, country, onCountryChange, locale}: {value: string; onChange: (value: string) => void; country?: Country; onCountryChange: (country: Country) => void; locale: Locale}) {
 const id = useId();
 const field = useRef<HTMLDivElement>(null);
 // Keep the explicit selection even when a partial number cannot identify a country.
 // Older drafts only contain the full number, so infer their initial selection.
 const defaultCountry = country || (value ? parsePhoneNumber(value)?.country || (['PL', 'GB', 'US', ...getCountries()] as Country[]).find(code => value.startsWith(`+${getCountryCallingCode(code)}`)) : undefined) || 'PL';
 useEffect(() => {
  field.current?.querySelector('input')?.setCustomValidity(value && !isPossiblePhoneNumber(value)
   ? locale === 'pl' ? 'Wpisz poprawny numer telefonu dla wybranego kraju.' : 'Enter a valid phone number for the selected country.'
   : '');
 }, [value, locale]);

 return <div className="phone-field" ref={field}>
  <label htmlFor={id}>{locale === 'pl' ? 'Telefon' : 'Phone number'}</label>
  <PhoneInput id={id} className="phone-control" name="phone" required defaultCountry={defaultCountry} onCountryChange={next => {if (next) onCountryChange(next);}} international={false} addInternationalOption={false} countryOptionsOrder={['PL', 'GB', 'DE', 'US', '...']} labels={locale === 'pl' ? pl : en} flags={flags} countrySelectComponent={CountrySelect} countrySelectProps={{locale}} smartCaret={false} autoComplete="tel-national" value={value || undefined} onChange={next => onChange(next || '')} placeholder={locale === 'pl' ? 'Numer telefonu' : 'Phone number'}/>
 </div>;
}
