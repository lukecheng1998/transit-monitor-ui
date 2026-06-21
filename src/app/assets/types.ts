export type Agency = 'Muni' | 'BART' | 'Caltrain' | 'GGT';
export interface TransitLine {
    line: string
    line_name?: string
    destination: string
    arrival_time?: number[]
    departure_time?: number[]
}
export interface GroupedRoute {
    routeId: string
    routeName: string
    badgeColor: string
    directions: {
        destination: string
        times: number[]
        isDeparture: boolean
    }[];
}
export type AgencyData = TransitLine[][];