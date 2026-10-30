'use client';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Dropdown, Option } from '@fluentui/react-components';
type Change = { target: { value: string }; currentTarget: { value: string } };
type Props = {
  children: ReactNode; value?: string|number; defaultValue?: string|number;
  onChange?: (change: Change)=>void; disabled?:boolean; required?:boolean; size?:'small'|'medium'|'large';
  className?:string; id?:string; name?:string; 'aria-label'?:string; 'aria-labelledby'?:string; 'aria-describedby'?:string; 'aria-invalid'?:boolean|'true'|'false';
};
type Choice={value:string;text:string;disabled:boolean};
function text(nodes:ReactNode):string { return Children.toArray(nodes).map(n=>typeof n==='string'||typeof n==='number'?String(n):isValidElement<{children?:ReactNode}>(n)?text(n.props.children):'').join(''); }
function choices(nodes:ReactNode):Choice[] {
  return Children.toArray(nodes).flatMap(n=>{
    if(!isValidElement<{value?:string|number;children?:ReactNode;disabled?:boolean}>(n))return [];
    if(n.type===Fragment)return choices(n.props.children);
    if(n.type!=='option')return [];
    const label=text(n.props.children);
    return [{value:String(n.props.value??label),text:label,disabled:!!n.props.disabled}];
  });
}
/** Shared Fluent popup for existing controlled option lists. No native select is rendered. */
export default function ChoiceSelect({children,value,defaultValue,onChange,required,name,...props}:Props){
  const options=choices(children),selected=String(value??defaultValue??options[0]?.value??'');
  return <><Dropdown {...props} className={['choice-select',props.className].filter(Boolean).join(' ')} aria-required={required||undefined} selectedOptions={[selected]} value={options.find(o=>o.value===selected)?.text||''} onOptionSelect={(_,d)=>{const next=d.optionValue??'';onChange?.({target:{value:next},currentTarget:{value:next}});}}>{options.map(o=><Option key={o.value} value={o.value} text={o.text} disabled={o.disabled}>{o.text}</Option>)}</Dropdown>{name&&<input type="hidden" name={name} value={selected}/>}</>;
}
