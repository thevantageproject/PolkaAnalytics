import React from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Stage, Layer, Arc, Circle, Text as KonvaText } from "react-konva";
import Validators from "./Validators";
import { withRouter } from "react-router-dom";
import { Spinner, Box, Text, Flex, Grid, Divider } from "@chakra-ui/core";

class NominatorApp extends React.Component {
	constructor() {
		super();
		this.latestBlockAuthor = undefined;
		this.state = {
			showValidatorAddress: false,
			copied: false,
			isLoaded: false
		};
		this.pathArray = window.location.href.split("/");
		this.ismounted = false;
		this.totalinfo = [];
		this.nominators = [];
		this.totalValidators = [];
		this.totalStake = 0;
		this.validatorWithHighestStake = 0;
		this.earningInPreviousEra = 0;
	}

	async componentDidMount() {
		this.deriveInfo();
	}

	deriveInfo = async () => {
		console.log("derive info running");
		const wsProvider = new WsProvider("wss://kusama-rpc.polkadot.io");
		const api = await ApiPromise.create({ provider: wsProvider });
		await api.isReady;
		const totalinfo = await Promise.all(
			this.props.valtotalinfo.map(
				async validator => await api.derive.staking.account(validator)
			)
		);
		let unfilteredNominators = [];
		totalinfo.forEach(ele => {
			ele.stakers.others.forEach(nom => {
				unfilteredNominators.push(nom.who);
			});
		});
		function onlyUnique(value, index, self) {
			return self.indexOf(value) === index;
		}
		let filteredNominators = unfilteredNominators.filter(onlyUnique);
		const nominators = await Promise.all(
			filteredNominators.map(async val => await api.derive.staking.account(val))
		);
		const parsedNominators = JSON.parse(JSON.stringify(nominators));
		
		let previous = await api.query.balances.freeBalance(this.props.history.location.pathname.split("/")[3].toString());
		const PARSED_PREVIOUS_ERA_EARNINGS = JSON.parse(JSON.stringify(previous));
		this.earningInPreviousEra = (PARSED_PREVIOUS_ERA_EARNINGS / 10 ** 12).toFixed(3);
		if (!this.ismounted) {
			this.nominators = parsedNominators;
			this.totalinfo = totalinfo;
			this.setState({ isLoaded: true });
			this.ismounted = true;
		}
		console.log("api ready");
	};

	handleOnMouseOver = () => {
		this.setState({ showValidatorAddress: true });
	};
	handleOnMouseOut = () => {
		this.setState({ showValidatorAddress: false });
	};

	BackbtnhandleOnMouseOver = () => {
		document.body.style.cursor = "pointer";
	};
	BackbtnhandleOnMouseOut = () => {
		document.body.style.cursor = "default";
	};

	BackbtnhandleClick = () => {
		document.body.style.cursor = "default";
		this.props.history.push({
			pathname: this.pathArray[4] === "kusama" ? "/kusama" : "/alexander",
			state: { totalinfo: this.totalinfo, valinfo: this.props.valinfo }
		});
	};
	homebtnhandleClick = () => {
		document.body.style.cursor = "default";
		this.props.history.push({
			pathname: "/",
			state: { totalinfo: this.totalinfo, valinfo: this.props.valinfo }
		});
	};

	onCopy = () => {
		this.setState({ copied: true }, () =>
			setInterval(() => {
				this.setState({ copied: false });
			}, 3000)
		);
	};

	handlePolkavizClick = () => {
		document.body.style.cursor = "default";
		this.props.history.push({
			pathname: "/"
		});
	};

	render() {
		let arr1 = [];
		let bonded = 0;
		let valbacked = [];
		let totalbonded = 0;
		let stashId = "";
		let controllerId = "";
		console.log("rendered");
		if (
			this.props.history.location.pathname.split("/")[3] !== undefined &&
			this.state.isLoaded
		) {
			this.totalinfo.forEach(ele => {
				ele.stakers.others.forEach(nom => {
					if (
						nom.who.toString() ===
						this.props.history.location.pathname.split("/")[3].toString()
					) {
						arr1.push({
							validator: ele,
							staked:
								nom.value /
								(this.pathArray[4] === "kusama"
									? Math.pow(10, 12)
									: Math.pow(10, 15))
						});
						bonded +=
							nom.value /
							(this.pathArray[4] === "kusama"
								? Math.pow(10, 12)
								: Math.pow(10, 15));
					}
				});
			});

			let nominatorvalue = "";
			this.nominators.forEach(ele => {
				if (
					ele.accountId ===
					this.props.history.location.pathname.split("/")[3].toString()
				) {
					nominatorvalue = ele.controllerId;
					stashId = ele.stashId;
				}
			});
			valbacked = arr1;
			totalbonded = bonded;
			controllerId = nominatorvalue;
			this.totalValidators = valbacked;
			this.totalStake = totalbonded;
			this.validatorWithHighestStake = Math.max(...valbacked.map(validator => validator.staked));
		}
		let nominatorname =
			this.props.history.location.pathname.split("/")[3] !== undefined
				? "Nominator (" +
				  this.props.history.location.pathname
						.split("/")[3]
						.toString()
						.slice(0, 8) +
				  "......" +
				  this.props.history.location.pathname
						.split("/")[3]
						.toString()
						.slice(-8) + ")"
				: "";

		let stashname =
			controllerId.toString().slice(0, 8) +
			"......" +
			controllerId.toString().slice(-8);

		let controllername = "controller: " + stashname;

		let bondvalue =
			"bonded: " +
			totalbonded.toString().slice(0, 5) +
			(this.pathArray[4] === "kusama" ? "KSM" : " DOT");

		let valtext =
			this.props.history.location.pathname.split("/")[3] !== undefined
				? this.props.history.location.pathname
						.split("/")[3]
						.toString()
						.slice(0, 8) +
				  "......" +
				  this.props.history.location.pathname
						.split("/")[3]
						.toString()
						.slice(-8)
				: "";

		let arr = valbacked;
		const width = window.innerWidth;
		const height = window.innerHeight;
		if (this.state.isLoaded) {
			return (
				<React.Fragment>
					<Box textAlign="center">
						<Box display="flex" justifyContent="center" mt={20} mb={8}>
							<Text fontSize="2xl" fontWeight="bold" alignSelf="center">{nominatorname}</Text>
						</Box>
						<Text mt={8} color="brand.900" opacity={this.state.copied ? 1 : 0}>
							Copied to your clipboard
						</Text>
					</Box>
					<Grid templateColumns="1fr 2fr" gap={2}>
					<Box width={350} height={540} style={{marginLeft: 40,marginTop: 40, boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)", borderRadius: '10px', padding: "5px 10px"}}>
					<Flex 
						flexDirection="column"
						alignItems="center">
					<Text align="center" mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
						Key Stats
					</Text>
					</Flex>
					<Divider />
					<Flex
						flexDirection="column"
						style={{padding: '0 20px'}}
					>
					<Text mt={2} fontSize="md" fontWeight="bold" lineHeight="short">
						Earning in previous era
					</Text>
					<Text>
						<span
						style={{textTransform: "uppercase", fontWeight: "bold", color: "#E50B7B"}}
						>{this.earningInPreviousEra} KSM</span>
					</Text>
					</Flex>
					<Divider />
					<Flex flexDirection="column" style={{padding: '0 20px'}}>
						<Text fontWeight="bold">Expected daily ROI</Text>
						{/*TODO: Calculate Expected daily ROI*/}
						<Text>KSM</Text>
					</Flex>
					<Divider />
					<Flex flexDirection="column" style={{padding: '0 20px'}}>
					<Text fontWeight="bold">Diversity</Text>
					<Text>
						Backing {this.totalValidators.length} different validator
					</Text>
					</Flex>
					<Divider />
					<Flex flexDirection="column" style={{padding: '0 20px'}}>
						<Text fontWeight="bold">Amount at stake</Text>
						<Text mt={3} fontSize="12px">Total</Text>
						<Text style={{color: "#E50B7B", fontWeight: "bold"}}>{this.totalStake.toFixed(3)} KSM</Text>
						<Text mt={3} fontSize="12px">On highest</Text>
						<Text fontWeight="bold">{this.validatorWithHighestStake.toFixed(3)} KSM</Text>
						<Text style={{color: "#718096", fontSize: 12}}>Highest amount staked on this validator</Text>
						<Text mt={3} fontSize="12px">On others</Text>
						<Text fontWeight="bold">{(this.totalStake - this.validatorWithHighestStake).toFixed(3)} KSM</Text>
						<Text style={{color: "#718096", fontSize: 12}}>Amount at stake for all validators combined excluding (Highest staked validator)</Text>
					</Flex>
					</Box>
					<Stage width={width} height={height}>
						<Layer>
							<Validators
								colorMode={this.props.colorMode}
								allvals={arr}
								rect_x={width / 2}
								circ_x={width / 2 - 200}
								circ_y={height / 2}
								totalinfo={this.totalinfo}
								history={this.props.history}
							/>
							<Arc
								x={width - 2}
								y={height / 2}
								innerRadius={height / 2 - 25}
								outerRadius={height / 2 - 24}
								rotation={90}
								angle={180}
								stroke={
									this.props.colorMode === "light" ? "#CBD5E0" : "#718096"
								}
								strokeWidth={4}
							/>

							<Circle
								x={width / 2 - 200}
								y={height / 2}
								radius={7}
								fill={this.props.colorMode === "light" ? "#1A202C" : "#FFFFFF"}
								onMouseOver={this.handleOnMouseOver}
								onMouseOut={this.handleOnMouseOut}
							/>

							{this.state.showValidatorAddress && (
								<KonvaText
									text={valtext}
									x={width / 2 - 200}
									y={height / 2 - 18}
									fill={
										this.props.colorMode === "light" ? "#1A202C" : "#FFFFFF"
									}
								/>
							)}
						</Layer>
					</Stage>
					</Grid>
					{/* <Flex justifyContent="center">
						<Box
							mt={12}
							display="flex"
							justifyContent="space-between"
							width="100%"
							maxW="960px"
							alignSelf="center"
							mb={8}
						>
							<Text>{controllername}</Text>
							<Text>{bondvalue}</Text>
						</Box>
					</Flex> */}
				</React.Fragment>
			);
		} else {
			return (
				<Box
					display="flex"
					flexDirection="column"
					position="absolute"
					top="50%"
					left="50%"
					transform="translate(-50%, -50%)"
					alignSelf="center"
					justifyContent="center"
					textAlign="center"
					mt={-16}
					zIndex={-1}
				>
					<Spinner as="span" size="lg" alignSelf="center" />
					<Text
						mt={4}
						fontSize="xl"
						color="gray.500"
						textAlign="center"
						alignSelf="center"
					>
						Stabilizing the isotopes...
					</Text>
				</Box>
			);
		}
	}
}

export default withRouter(NominatorApp);
