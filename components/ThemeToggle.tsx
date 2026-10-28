'use client';
import { Button, Tooltip } from '@fluentui/react-components';
import { WeatherMoonRegular } from '@fluentui/react-icons/svg/weather-moon';
import { WeatherSunnyRegular } from '@fluentui/react-icons/svg/weather-sunny';
import { useAppTheme } from './FluentTheme';
export default function ThemeToggle() {
  const {dark,toggle} = useAppTheme();
  const label = dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';
  return <Tooltip content={label} relationship="label"><Button appearance="subtle" icon={dark ? <WeatherSunnyRegular /> : <WeatherMoonRegular />} aria-label={label} onClick={toggle} /></Tooltip>;
}
